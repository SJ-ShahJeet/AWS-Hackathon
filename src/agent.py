import asyncio
import json
import logging
import os
from collections.abc import Callable, Sequence
from typing import Any

import aiohttp
from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentSession,
    FunctionToolsExecutedEvent,
    JobContext,
    JobProcess,
    MetricsCollectedEvent,
    RoomInputOptions,
    WorkerOptions,
    cli,
    metrics,
)
from livekit.agents.llm import (
    FunctionTool,
    ProviderTool,
    RawFunctionTool,
    Tool,
    Toolset,
)
from livekit.plugins import anam, elevenlabs, hedra, noise_cancellation, silero, tavus
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from google_tools import GOOGLE_TOOLS, google_credentials_configured, setup_google_credentials
from mcp_client.agent_tools import MCPToolsIntegration
from mcp_client.server import MCPServerSse
from tools import open_url

logger = logging.getLogger("agent")

AVATAR_PROVIDERS = ("anam", "hedra", "tavus")
AGENT_TOOL_TOPIC = "lk.agent.tool"
AGENT_TOOL_CATALOG_TOPIC = "lk.agent.catalog"
_TOOL_UI_OUTPUT_MAX = 4000


def _collect_tool_catalog_rows(agent: Agent) -> list[dict[str, str]]:
    """Flatten session tools into name + description for the UI catalog."""
    rows: list[dict[str, str]] = []
    seen: set[str] = set()

    def add(name: str, description: str) -> None:
        if name in seen:
            return
        seen.add(name)
        rows.append({"name": name, "description": description})

    def walk(tool: Tool | Toolset) -> None:
        if isinstance(tool, FunctionTool):
            desc = (tool.info.description or "").strip()
            add(tool.info.name, desc)
        elif isinstance(tool, RawFunctionTool):
            desc = ""
            raw = tool.info.raw_schema
            if isinstance(raw, dict):
                d = raw.get("description")
                if isinstance(d, str):
                    desc = d.strip()
            add(tool.info.name, desc)
        elif isinstance(tool, Toolset):
            for inner in tool.tools:
                walk(inner)
        elif isinstance(tool, ProviderTool):
            add(tool.id, "")

    for t in agent.tools:
        walk(t)

    return rows


def _parse_tool_arguments(raw_arguments: str | None) -> Any:
    if not raw_arguments:
        return {}
    try:
        return json.loads(raw_arguments)
    except json.JSONDecodeError:
        return {"_raw": raw_arguments}


def _extract_tool_rows_from_event(
    ev: Any, *, include_outputs: bool
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    if not hasattr(ev, "zipped"):
        return rows

    try:
        zipped = ev.zipped()
    except Exception:
        return rows

    for call, out in zipped:
        output: str | None = None
        is_error = False

        if include_outputs and out is not None:
            output = out.output
            if output and len(output) > _TOOL_UI_OUTPUT_MAX:
                output = output[:_TOOL_UI_OUTPUT_MAX] + "…"
            is_error = out.is_error

        rows.append(
            {
                "name": call.name,
                "arguments": _parse_tool_arguments(call.arguments),
                "output": output,
                "is_error": is_error,
                "call_id": call.call_id,
            }
        )

    return rows

repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_env_path = os.path.join(repo_root, ".env")
if os.path.exists(_env_path):
    load_dotenv(_env_path, override=True)


def _env(key: str) -> str:
    return (os.environ.get(key) or "").strip()


class Assistant(Agent):
    def __init__(self, tools: Sequence[Callable] | None = None) -> None:
        merged_tools = [open_url]
        if tools:
            merged_tools.extend(list(tools))
        super().__init__(
            instructions=(
                "You are a helpful voice AI assistant. The user is interacting "
                "with you via voice, even if you perceive the conversation as text. "
                "You eagerly assist users with their questions by providing information "
                "from your extensive knowledge. Your responses are concise, to the "
                "point, and without any complex formatting or punctuation including "
                "emojis, asterisks, or other symbols. You are curious, friendly, "
                "and have a sense of humor."
            ),
            tools=merged_tools,
        )


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()


def _parse_avatar_provider(room_name: str) -> tuple[str | None, str]:
    """Extract avatar provider and optional extra ID from room name."""
    for provider in AVATAR_PROVIDERS:
        marker = f"-a-{provider}"
        if marker not in room_name:
            continue
        extra_id = ""
        id_prefix = f"{marker}-"
        if id_prefix in room_name:
            extra_id = room_name.split(id_prefix, 1)[1].strip()
        return provider, extra_id

    if os.environ.get("ENABLE_AVATAR", "false").lower() == "true":
        return "anam", ""
    return None, ""


async def _resolve_anam_engine_avatar_id(api_key: str, configured_id: str) -> str:
    """
    The Anam engine expects an avatar resource id (GET /v1/avatars).
    Lab users often copy a persona id instead; resolve via GET /v1/personas/{id}.
    """
    base = (_env("ANAM_API_URL") or "https://api.anam.ai").rstrip("/")
    headers = {"Authorization": f"Bearer {api_key}", "Accept": "application/json"}
    timeout = aiohttp.ClientTimeout(total=20)
    async with aiohttp.ClientSession(timeout=timeout) as session:
        url_av = f"{base}/v1/avatars/{configured_id}"
        async with session.get(url_av, headers=headers) as r:
            if r.status == 200:
                return configured_id
            if r.status != 404:
                body = await r.text()
                raise RuntimeError(
                    f"Anam avatar lookup failed (HTTP {r.status}): {body[:300]}"
                )
        url_p = f"{base}/v1/personas/{configured_id}"
        async with session.get(url_p, headers=headers) as r:
            if r.status != 200:
                body = await r.text()
                raise RuntimeError(
                    "Anam id is not a known avatar or persona for this API key "
                    f"(HTTP {r.status}): {body[:300]}"
                )
            persona = await r.json()
        nested = (persona.get("avatar") or {}).get("id")
        if not nested:
            raise RuntimeError("Anam persona response had no avatar.id")
        logger.info(
            "ANAM_AVATAR_ID is a persona id; using linked engine avatar id %s",
            nested,
        )
        return nested


def _build_avatar_session(
    provider: str,
    extra_id: str,
    *,
    anam_avatar_id: str | None = None,
) -> anam.AvatarSession | hedra.AvatarSession | tavus.AvatarSession | None:
    """Build the avatar session object for the given provider, or None if misconfigured."""
    if provider == "anam":
        api_key = _env("ANAM_API_KEY")
        avatar_id = (anam_avatar_id or _env("ANAM_AVATAR_ID")).strip()
        if not api_key or not avatar_id:
            logger.warning("Anam requested but ANAM_API_KEY or ANAM_AVATAR_ID missing")
            return None
        return anam.AvatarSession(
            persona_config=anam.PersonaConfig(
                name="Assistant",
                avatarId=avatar_id,
            ),
            api_key=api_key,
        )

    if provider == "hedra":
        api_key = _env("HEDRA_API_KEY")
        avatar_id = (extra_id or _env("HEDRA_DEFAULT_AVATAR_ID")).strip()
        if not api_key or not avatar_id:
            logger.warning("Hedra requested but HEDRA_API_KEY or avatar ID missing")
            return None
        return hedra.AvatarSession(avatar_id=avatar_id, api_key=api_key)

    if provider == "tavus":
        return tavus.AvatarSession(
            replica_id=_env("REPLICA_ID"),
            persona_id=_env("PERSONA_ID"),
            api_key=_env("TAVUS_API_KEY"),
        )

    return None


async def entrypoint(ctx: JobContext):
    ctx.log_context_fields = {"room": ctx.room.name}

    setup_google_credentials()
    google_tools = GOOGLE_TOOLS if google_credentials_configured() else []
    if google_tools:
        logger.info("Google Workspace tools enabled (%d tools)", len(google_tools))

    mcp_url = os.environ.get("MCP_URL")
    mcp_api_key = os.environ.get("MCP_API_KEY")
    if mcp_url:
        logger.info("MCP_URL found, preparing MCP tools")
        mcp_server = MCPServerSse(
            params={
                "url": mcp_url,
                "headers": {"Authorization": f"Bearer {mcp_api_key}"} if mcp_api_key else {},
            },
            name="mcp_main_server",
        )
        agent = await MCPToolsIntegration.create_agent_with_tools(
            agent_class=Assistant,
            mcp_servers=[mcp_server],
            agent_kwargs={"tools": google_tools} if google_tools else {},
        )
    else:
        logger.info("MCP_URL not found, starting agent without MCP tools")
        agent = Assistant(tools=google_tools if google_tools else None)

    session = AgentSession(
        stt="deepgram/nova-3:multi",
        llm="google/gemini-2.5-flash",
        tts=elevenlabs.TTS(
            voice_id=_env("ELEVENLABS_VOICE_ID") or "ZMWIEDLYkh84bAIlHt0B",
            model="eleven_flash_v2_5",
            api_key=os.environ.get("ELEVENLABS_API_KEY") or os.environ.get("ELEVEN_API_KEY"),
        ),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
        false_interruption_timeout=None,
    )

    usage_collector = metrics.UsageCollector()
    asyncio_tasks: set[asyncio.Task[None]] = set()

    @session.on("metrics_collected")
    def _on_metrics_collected(ev: MetricsCollectedEvent):
        metrics.log_metrics(ev.metrics)
        usage_collector.collect(ev.metrics)

    @session.on("function_tools_executed")
    def _on_function_tools_executed(ev: FunctionToolsExecutedEvent) -> None:
        rows = _extract_tool_rows_from_event(ev, include_outputs=True)
        if not rows:
            return

        payload = json.dumps({"v": 2, "phase": "completed", "tools": rows})

        async def _send_tool_notice() -> None:
            try:
                await ctx.room.local_participant.send_text(payload, topic=AGENT_TOOL_TOPIC)
            except Exception as e:
                logger.warning("failed to publish tool notice to room: %s", e)

        task = asyncio.create_task(_send_tool_notice())
        asyncio_tasks.add(task)
        task.add_done_callback(asyncio_tasks.discard)

    @session.on("function_tools_executing")
    def _on_function_tools_executing(ev: Any) -> None:
        rows = _extract_tool_rows_from_event(ev, include_outputs=False)
        if not rows:
            return

        payload = json.dumps({"v": 2, "phase": "running", "tools": rows})

        async def _send_tool_running_notice() -> None:
            try:
                await ctx.room.local_participant.send_text(payload, topic=AGENT_TOOL_TOPIC)
            except Exception as e:
                logger.warning("failed to publish running tool notice to room: %s", e)

        task = asyncio.create_task(_send_tool_running_notice())
        asyncio_tasks.add(task)
        task.add_done_callback(asyncio_tasks.discard)

    async def log_usage():
        summary = usage_collector.get_summary()
        logger.info(f"Usage: {summary}")

    ctx.add_shutdown_callback(log_usage)

    avatar_provider, avatar_extra_id = _parse_avatar_provider(ctx.room.name)
    if avatar_provider:
        anam_avatar_id: str | None = None
        anam_resolution_failed = False
        if avatar_provider == "anam":
            ak, raw = _env("ANAM_API_KEY"), _env("ANAM_AVATAR_ID")
            if ak and raw:
                try:
                    anam_avatar_id = await _resolve_anam_engine_avatar_id(ak, raw)
                except Exception as e:
                    logger.error("Anam avatar id resolution failed: %s", e)
                    anam_resolution_failed = True
        avatar_session = None
        if not anam_resolution_failed:
            avatar_session = _build_avatar_session(
                avatar_provider, avatar_extra_id, anam_avatar_id=anam_avatar_id
            )
        if avatar_session:
            logger.info(f"Starting {avatar_provider} avatar session...")
            try:
                await avatar_session.start(session, room=ctx.room)
                logger.info(f"{avatar_provider} avatar started")
            except Exception as e:
                logger.error(f"{avatar_provider} avatar error: {e.__class__.__name__}: {e}")
                raise
    else:
        logger.info("Avatar disabled")

    await session.start(
        agent=agent,
        room=ctx.room,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )
    chat_tasks: set[asyncio.Task[None]] = set()

    async def _handle_chat_text_stream(reader, participant_identity):
        sender_identity = (
            participant_identity
            if isinstance(participant_identity, str)
            else getattr(participant_identity, "identity", None)
        )
        if not sender_identity:
            return

        # Ignore agent/self-originated room messages.
        if sender_identity == ctx.room.local_participant.identity:
            return

        sender = ctx.room.remote_participants.get(sender_identity)
        if sender and sender.kind == rtc.ParticipantKind.PARTICIPANT_KIND_AGENT:
            return

        chunks: list[str] = []
        async for chunk in reader:
            chunks.append(chunk)

        text = "".join(chunks).strip()
        if not text:
            return

        await session.interrupt()
        session.generate_reply(user_input=text, input_modality="text")

    def _on_chat_text_stream(reader, participant_identity):
        task = asyncio.create_task(_handle_chat_text_stream(reader, participant_identity))
        chat_tasks.add(task)
        task.add_done_callback(chat_tasks.discard)

    ctx.room.register_text_stream_handler("lk.chat", _on_chat_text_stream)
    await ctx.connect()

    async def _publish_tool_catalog() -> None:
        try:
            catalog = _collect_tool_catalog_rows(agent)
            payload = json.dumps({"v": 1, "tools": catalog})
            await ctx.room.local_participant.send_text(
                payload,
                topic=AGENT_TOOL_CATALOG_TOPIC,
            )
        except Exception as e:
            logger.warning("failed to publish tool catalog: %s", e)

    task_catalog = asyncio.create_task(_publish_tool_catalog())
    asyncio_tasks.add(task_catalog)
    task_catalog.add_done_callback(asyncio_tasks.discard)


if __name__ == "__main__":
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint, prewarm_fnc=prewarm))
