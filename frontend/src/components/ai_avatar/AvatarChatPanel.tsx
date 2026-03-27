import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useChat, useRoomContext, useTranscriptions, useVoiceAssistant } from "@livekit/components-react";
import { Track } from "livekit-client";
import { Info, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const AGENT_TOOL_TOPIC = "lk.agent.tool";
const AGENT_TOOL_CATALOG_TOPIC = "lk.agent.catalog";
const AGENT_OPEN_URL_TOPIC = "lk.agent.open_url";
const TRANSCRIPTION_FINAL_ATTR = "lk.transcription_final";
const TRANSCRIPTION_SEGMENT_ID_ATTR = "lk.segment_id";
const TRANSCRIBED_TRACK_ID_ATTR = "lk.transcribed_track_id";
const VOICE_FINALIZE_IDLE_MS = 1200;

type AvatarChatPanelProps = {
  suggestedText?: string;
  onSuggestedTextUsed?: () => void;
};

type ToolCallInfo = {
  name: string;
  arguments: unknown;
  output: string | null;
  is_error: boolean;
  call_id: string;
  phase: "running" | "completed";
};

type ToolCatalogEntry = {
  name: string;
  description: string;
};

type ChatEntry =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string }
  | { id: string; role: "tool"; tools: ToolCallInfo[] };

type AgentToolPayload = {
  phase: "running" | "completed";
  tools: ToolCallInfo[];
};

function parseAgentToolPayload(raw: string): AgentToolPayload | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const rec = parsed as Record<string, unknown>;
  if (!Array.isArray(rec.tools)) return null;
  const version = rec.v;
  const phase =
    version === 2 && rec.phase === "running"
      ? "running"
      : version === 2 && rec.phase === "completed"
        ? "completed"
        : version === 1
          ? "completed"
          : null;
  if (!phase) return null;
  const out: ToolCallInfo[] = [];
  for (const item of rec.tools) {
    if (!item || typeof item !== "object") continue;
    const t = item as Record<string, unknown>;
    if (typeof t.name !== "string" || typeof t.call_id !== "string") continue;
    out.push({
      name: t.name,
      arguments: t.arguments,
      output: typeof t.output === "string" ? t.output : t.output == null ? null : String(t.output),
      is_error: t.is_error === true,
      call_id: t.call_id,
      phase,
    });
  }
  return out.length > 0 ? { phase, tools: out } : null;
}

function parseAgentCatalogPayload(raw: string): ToolCatalogEntry[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const rec = parsed as Record<string, unknown>;
  if (rec.v !== 1 || !Array.isArray(rec.tools)) return null;
  const out: ToolCatalogEntry[] = [];
  for (const item of rec.tools) {
    if (!item || typeof item !== "object") continue;
    const t = item as Record<string, unknown>;
    if (typeof t.name !== "string") continue;
    const description = typeof t.description === "string" ? t.description : "";
    out.push({ name: t.name, description });
  }
  return out;
}

function tryOpenUrlFromAgentPayload(raw: string): void {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return;
  }
  if (!parsed || typeof parsed !== "object") return;
  const rec = parsed as Record<string, unknown>;
  if (rec.v !== 1 || typeof rec.url !== "string") return;
  try {
    const u = new URL(rec.url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return;
    window.open(u.href, "_blank", "noopener,noreferrer");
  } catch {
    /* invalid URL */
  }
}

const AvatarChatPanel = ({ suggestedText, onSuggestedTextUsed }: AvatarChatPanelProps) => {
  const [input, setInput] = useState("");
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [pendingVoiceText, setPendingVoiceText] = useState("");
  const [sessionTools, setSessionTools] = useState<ToolCatalogEntry[] | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const toolEntryByCallIdRef = useRef<Map<string, string>>(new Map());
  const pendingToolPayloadsRef = useRef<AgentToolPayload[]>([]);
  const pendingToolFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingVoiceCommitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingVoiceCandidateIdRef = useRef<string | null>(null);
  const waitingForAssistantRef = useRef(false);
  const room = useRoomContext();
  const { chatMessages, send, isSending } = useChat();
  const { agentTranscriptions } = useVoiceAssistant();
  const transcriptionStreams = useTranscriptions({ room });

  const applyToolPayload = useCallback((payload: AgentToolPayload) => {
    setEntries((prev) => {
      const next = [...prev];
      for (const tool of payload.tools) {
        const existingEntryId = toolEntryByCallIdRef.current.get(tool.call_id);
        if (existingEntryId) {
          const idx = next.findIndex((entry) => entry.id === existingEntryId && entry.role === "tool");
          if (idx >= 0) {
            const entry = next[idx] as Extract<ChatEntry, { role: "tool" }>;
            next[idx] = {
              ...entry,
              tools: entry.tools.map((existingTool) =>
                existingTool.call_id === tool.call_id ? { ...existingTool, ...tool } : existingTool,
              ),
            };
            continue;
          }
        }

        const id = `tool:${tool.call_id}`;
        toolEntryByCallIdRef.current.set(tool.call_id, id);
        next.push({ id, role: "tool", tools: [tool] });
      }
      return next;
    });
  }, []);

  const appendUserVoiceEntry = useCallback((id: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed || seenIdsRef.current.has(id)) return false;
    seenIdsRef.current.add(id);
    setEntries((prev) => [...prev, { id, role: "user", text: trimmed }]);
    waitingForAssistantRef.current = true;
    return true;
  }, []);

  const flushPendingToolPayloads = useCallback(() => {
    if (pendingToolFlushTimerRef.current) {
      clearTimeout(pendingToolFlushTimerRef.current);
      pendingToolFlushTimerRef.current = null;
    }
    if (pendingToolPayloadsRef.current.length === 0) return;
    const payloads = pendingToolPayloadsRef.current.splice(0, pendingToolPayloadsRef.current.length);
    for (const payload of payloads) {
      applyToolPayload(payload);
    }
  }, [applyToolPayload]);

  const queueToolPayloadUntilAssistant = useCallback((payload: AgentToolPayload) => {
    pendingToolPayloadsRef.current.push(payload);
    if (pendingToolFlushTimerRef.current) {
      clearTimeout(pendingToolFlushTimerRef.current);
    }
    pendingToolFlushTimerRef.current = setTimeout(() => {
      waitingForAssistantRef.current = false;
      flushPendingToolPayloads();
    }, 1800);
  }, [flushPendingToolPayloads]);

  useEffect(() => {
    if (!suggestedText) return;
    setInput(suggestedText);
    onSuggestedTextUsed?.();
  }, [suggestedText, onSuggestedTextUsed]);

  useEffect(() => {
    const handleToolStream = (
      reader: AsyncIterable<string>,
      participantInfo: { identity: string },
    ) => {
      const participant = room.remoteParticipants.get(participantInfo.identity);
      if (!participant?.isAgent) return;

      void (async () => {
        let text = "";
        try {
          for await (const chunk of reader) {
            text += chunk;
          }
        } catch {
          return;
        }
        const payload = parseAgentToolPayload(text.trim());
        if (!payload) return;
        if (waitingForAssistantRef.current) {
          queueToolPayloadUntilAssistant(payload);
          return;
        }
        applyToolPayload(payload);
      })();
    };

    room.registerTextStreamHandler(AGENT_TOOL_TOPIC, handleToolStream);
    return () => {
      room.unregisterTextStreamHandler(AGENT_TOOL_TOPIC);
    };
  }, [room, applyToolPayload, queueToolPayloadUntilAssistant]);

  useEffect(() => {
    const handleCatalogStream = (
      reader: AsyncIterable<string>,
      participantInfo: { identity: string },
    ) => {
      const participant = room.remoteParticipants.get(participantInfo.identity);
      if (!participant?.isAgent) return;

      void (async () => {
        let text = "";
        try {
          for await (const chunk of reader) {
            text += chunk;
          }
        } catch {
          return;
        }
        const catalog = parseAgentCatalogPayload(text.trim());
        if (!catalog) return;
        setSessionTools(catalog);
      })();
    };

    room.registerTextStreamHandler(AGENT_TOOL_CATALOG_TOPIC, handleCatalogStream);
    return () => {
      room.unregisterTextStreamHandler(AGENT_TOOL_CATALOG_TOPIC);
    };
  }, [room]);

  useEffect(() => {
    const handleOpenUrlStream = (
      reader: AsyncIterable<string>,
      participantInfo: { identity: string },
    ) => {
      const participant = room.remoteParticipants.get(participantInfo.identity);
      if (!participant?.isAgent) return;

      void (async () => {
        let text = "";
        try {
          for await (const chunk of reader) {
            text += chunk;
          }
        } catch {
          return;
        }
        tryOpenUrlFromAgentPayload(text.trim());
      })();
    };

    room.registerTextStreamHandler(AGENT_OPEN_URL_TOPIC, handleOpenUrlStream);
    return () => {
      room.unregisterTextStreamHandler(AGENT_OPEN_URL_TOPIC);
    };
  }, [room]);

  useEffect(() => {
    return () => {
      if (pendingToolFlushTimerRef.current) {
        clearTimeout(pendingToolFlushTimerRef.current);
      }
      if (pendingVoiceCommitTimerRef.current) {
        clearTimeout(pendingVoiceCommitTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const newEntries: ChatEntry[] = [];
    let hasNewLocalUserMessage = false;
    let hasNewAssistantMessage = false;
    let hasCommittedUserVoiceSegment = false;
    let latestPendingLocalVoiceText = "";
    let latestPendingLocalVoiceId = "";
    let latestLocalVoiceTs = Number.NEGATIVE_INFINITY;
    let latestLocalVoiceIsFinal = false;

    for (const message of chatMessages) {
      const text = message.message.trim();
      if (!text || !message.from?.isLocal) continue;

      const id = `user:${message.id ?? message.timestamp}`;
      if (seenIdsRef.current.has(id)) continue;
      seenIdsRef.current.add(id);
      newEntries.push({ id, role: "user", text });
      hasNewLocalUserMessage = true;
    }

    for (const segment of agentTranscriptions) {
      const text = segment.text.trim();
      if (!segment.final || !text) continue;

      const id = `assistant:${segment.id}`;
      if (seenIdsRef.current.has(id)) continue;
      seenIdsRef.current.add(id);
      newEntries.push({ id, role: "assistant", text });
      hasNewAssistantMessage = true;
    }

    const localMicTrackSids = new Set(
      room.localParticipant
        .getTrackPublications()
        .filter((pub) => pub.source === Track.Source.Microphone && typeof pub.trackSid === "string")
        .map((pub) => pub.trackSid),
    );

    for (const stream of transcriptionStreams) {
      const text = stream.text.trim();
      if (!text) continue;

      const attrs = stream.streamInfo.attributes ?? {};
      const transcribedTrackId = attrs[TRANSCRIBED_TRACK_ID_ATTR];
      const isLocalUserTranscription =
        stream.participantInfo.identity === room.localParticipant.identity ||
        (typeof transcribedTrackId === "string" && localMicTrackSids.has(transcribedTrackId));
      if (!isLocalUserTranscription) continue;

      const finalAttr = attrs[TRANSCRIPTION_FINAL_ATTR];
      const isFinal =
        finalAttr === true || finalAttr === 1 || finalAttr === "true" || finalAttr === "1";
      const segmentId = String(attrs[TRANSCRIPTION_SEGMENT_ID_ATTR] ?? stream.streamInfo.id ?? "");
      if (!segmentId) continue;
      const id = `user:voice:${segmentId}`;
      if (seenIdsRef.current.has(id)) {
        continue;
      }
      const ts = Number(stream.streamInfo.timestamp ?? 0);
      const isNewerThanLatest = ts > latestLocalVoiceTs || (ts === latestLocalVoiceTs && isFinal);
      if (isNewerThanLatest) {
        latestLocalVoiceTs = ts;
        latestLocalVoiceIsFinal = isFinal;
        if (isFinal) {
          latestPendingLocalVoiceText = "";
          latestPendingLocalVoiceId = "";
        } else {
          latestPendingLocalVoiceText = text;
          latestPendingLocalVoiceId = id;
        }
      }
      if (!isFinal) {
        continue;
      }

      if (seenIdsRef.current.has(id)) continue;
      seenIdsRef.current.add(id);
      newEntries.push({ id, role: "user", text });
      hasNewLocalUserMessage = true;
      hasCommittedUserVoiceSegment = true;
    }

    if (hasCommittedUserVoiceSegment || latestLocalVoiceIsFinal) {
      latestPendingLocalVoiceText = "";
      latestPendingLocalVoiceId = "";
    }
    setPendingVoiceText(latestPendingLocalVoiceText);
    if (pendingVoiceCommitTimerRef.current) {
      clearTimeout(pendingVoiceCommitTimerRef.current);
      pendingVoiceCommitTimerRef.current = null;
    }
    pendingVoiceCandidateIdRef.current = null;
    if (latestPendingLocalVoiceText && latestPendingLocalVoiceId) {
      pendingVoiceCandidateIdRef.current = latestPendingLocalVoiceId;
      pendingVoiceCommitTimerRef.current = setTimeout(() => {
        if (pendingVoiceCandidateIdRef.current !== latestPendingLocalVoiceId) return;
        const committed = appendUserVoiceEntry(latestPendingLocalVoiceId, latestPendingLocalVoiceText);
        if (!committed) return;
        pendingVoiceCandidateIdRef.current = null;
        setPendingVoiceText("");
      }, VOICE_FINALIZE_IDLE_MS);
    }

    if (newEntries.length > 0) {
      setEntries((prev) => [...prev, ...newEntries]);
    }
    if (hasNewLocalUserMessage) {
      waitingForAssistantRef.current = true;
    }
    if (hasNewAssistantMessage) {
      waitingForAssistantRef.current = false;
      flushPendingToolPayloads();
    }
  }, [chatMessages, agentTranscriptions, transcriptionStreams, flushPendingToolPayloads, room, appendUserVoiceEntry]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [entries, pendingVoiceText, isSending]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    await send(text);
  };

  return (
    <div className="chat-panel">
      <div className="chat-panel-head">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="chat-tool-catalog-trigger"
              aria-label="Tools available to the agent in this session"
            >
              <Info className="chat-tool-catalog-icon" strokeWidth={2} aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            side="bottom"
            className="chat-tool-catalog-popover w-[min(20rem,calc(100vw-2rem))] max-h-56 overflow-y-auto p-3 text-sm"
          >
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Session tools
            </p>
            {sessionTools === null ? (
              <p className="text-muted-foreground">Waiting for the agent…</p>
            ) : sessionTools.length === 0 ? (
              <p className="text-muted-foreground">No tools in this session.</p>
            ) : (
              <ul className="m-0 list-none space-y-2.5 p-0">
                {sessionTools.map((t) => (
                  <li key={t.name}>
                    <div className="font-mono text-xs font-semibold text-foreground">{t.name}</div>
                    {t.description ? (
                      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{t.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </PopoverContent>
        </Popover>
      </div>
      <div className="chat-messages" ref={listRef}>
        {entries.map((message) => {
          if (message.role === "tool") {
            return (
              <div key={message.id} className="chat-message chat-message-tool">
                <div className="chat-tool-header">
                  <Wrench className="chat-tool-icon" aria-hidden />
                  <span>Tool call</span>
                </div>
                {message.tools.map((t) => (
                  <div key={t.call_id} className="chat-tool-block">
                    <div className="chat-tool-name-row">
                      <div className="chat-tool-name">{t.name}</div>
                      {t.phase === "running" ? (
                        <div className="chat-tool-status chat-tool-status-running" role="status" aria-live="polite">
                          <span className="chat-tool-spinner" aria-hidden />
                          Running
                        </div>
                      ) : (
                        <div className="chat-tool-status chat-tool-status-complete">Done</div>
                      )}
                    </div>
                    <pre className="chat-tool-pre">{JSON.stringify(t.arguments, null, 2)}</pre>
                    {t.phase === "running" ? (
                      <div className="chat-tool-loading">Waiting for tool output…</div>
                    ) : t.output != null && t.output !== "" ? (
                      <pre
                        className={
                          t.is_error ? "chat-tool-pre chat-tool-output chat-tool-output-error" : "chat-tool-pre chat-tool-output"
                        }
                      >
                        {t.output}
                      </pre>
                    ) : null}
                  </div>
                ))}
              </div>
            );
          }
          return (
            <div
              key={message.id}
              className={`chat-message ${message.role === "user" ? "chat-message-user" : "chat-message-assistant"}`}
            >
              <p>{message.text}</p>
            </div>
          );
        })}
        {pendingVoiceText && (
          <div className="chat-message chat-message-user chat-message-pending" aria-live="polite">
            <p>{pendingVoiceText}</p>
          </div>
        )}
        {isSending && <p className="chat-status">Sending...</p>}
      </div>

      <form className="chat-input-row" onSubmit={handleSubmit}>
        <Input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type a message..."
          className="chat-input"
        />
        <Button type="submit" disabled={isSending}>
          Send
        </Button>
      </form>
    </div>
  );
};

export default AvatarChatPanel;
