import { useState, useCallback, useEffect, useRef } from "react";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import AvatarVoiceAgent from "./AvatarVoiceAgent";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Upload, User } from "lucide-react";
import "./LiveKitWidget.css";

const HEDRA_STORAGE_KEY = "hedraAvatar";

const buildApiUrl = (path) => {
  const rawBase = import.meta?.env?.VITE_API_BASE;
  const base = typeof rawBase === "string" ? rawBase.replace(/\/+$/, "") : "";
  return base ? `${base}${path}` : path;
};

const AVATAR_OPTIONS = [
  { value: "none", label: "None" },
  { value: "tavus", label: "Tavus" },
  { value: "hedra", label: "Hedra" },
];

const loadHedraAvatar = () => {
  try {
    const s = localStorage.getItem(HEDRA_STORAGE_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
};

const saveHedraAvatar = (data) => {
  try {
    localStorage.setItem(HEDRA_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
};

const LiveKitWidget = ({ setShowSupport }) => {
  const [token, setToken] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [avatarProvider, setAvatarProvider] = useState("tavus");
  const [hedraAvatar, setHedraAvatar] = useState(loadHedraAvatar);
  const [defaultHedraAvatarId, setDefaultHedraAvatarId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(buildApiUrl('/api/config'));
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setDefaultHedraAvatarId(data.defaultHedraAvatarId || null);
      } catch (e) {
        console.error('Failed to fetch config', e);
      } finally {
        if (!cancelled) setLoadingConfig(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleHedraUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(buildApiUrl("/api/hedra/upload"), {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }
      const { assetId, thumbnailUrl } = await res.json();
      const data = { assetId, thumbnailUrl };
      saveHedraAvatar(data);
      setHedraAvatar(data);
    } catch (err) {
      console.error(err);
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }, []);

  const hedraAssetId = hedraAvatar?.assetId || defaultHedraAvatarId;

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const params = new URLSearchParams({ name: "admin" });
      if (avatarProvider === "tavus" || avatarProvider === "hedra") {
        params.set("avatar", avatarProvider);
        if (avatarProvider === "hedra" && hedraAssetId) {
          params.set("avatar_id", hedraAssetId);
        }
      }
      const response = await fetch(buildApiUrl(`/api/getToken?${params}`));
      const token = await response.text();
      setToken(token);
    } catch (error) {
      console.error(error);
    } finally {
      setIsConnecting(false);
    }
  }, [avatarProvider, hedraAssetId]);

  return (
    <div className="modal-content">
      <div className="support-room">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Concierge</h2>
        </div>
        {loadingConfig ? (
          <div className="connecting-status">
            <h2>Loading configuration...</h2>
          </div>
        ) : !token ? (
          <div className="connect-step">
            <p className="avatar-label">Avatar provider</p>
            <ToggleGroup
              type="single"
              value={avatarProvider}
              onValueChange={(v) => v && setAvatarProvider(v)}
              className="avatar-toggle"
            >
              {AVATAR_OPTIONS.map((opt) => (
                <ToggleGroupItem key={opt.value} value={opt.value} aria-label={opt.label}>
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {avatarProvider === "hedra" && (
              <div className="hedra-avatar-section">
                <p className="avatar-label">Avatar image</p>
                <div className="hedra-avatar-preview">
                  {hedraAvatar?.thumbnailUrl ? (
                    <img src={hedraAvatar.thumbnailUrl} alt="Current avatar" />
                  ) : hedraAssetId ? (
                    <img src="/default-avatar.png" alt="Default avatar" />
                  ) : (
                    <div className="hedra-avatar-placeholder">
                      <User className="h-12 w-12" />
                      <span>Upload a portrait</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleHedraUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading..." : hedraAvatar ? "Replace" : "Upload"}
                </Button>
              </div>
            )}
            <div className="connect-actions">
              <Button variant="outline" onClick={() => setShowSupport(false)}>
                Cancel
              </Button>
              <Button
                onClick={connect}
                disabled={
                  isConnecting ||
                  (avatarProvider === "hedra" && !hedraAssetId)
                }
              >
                {isConnecting ? "Connecting..." : "Connect"}
              </Button>
            </div>
          </div>
        ) : (
          <LiveKitRoom
            key={token}
            serverUrl={import.meta.env.VITE_LIVEKIT_URL}
            token={token}
            connect={true}
            video={false}
            audio={true}
            onDisconnected={() => {
              setShowSupport(false);
              setToken(null);
            }}
          >
            <RoomAudioRenderer />
            <AvatarVoiceAgent />
          </LiveKitRoom>
        )}
      </div>
    </div>
  );
};

export default LiveKitWidget;