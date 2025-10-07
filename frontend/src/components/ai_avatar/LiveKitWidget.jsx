import { useState, useCallback, useEffect } from "react";
import { LiveKitRoom, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import AvatarVoiceAgent from "./AvatarVoiceAgent";
import "./LiveKitWidget.css";

// Build absolute API URL in production (Vercel), fallback to relative path in dev (Vite proxy)
const buildApiUrl = (path) => {
  const rawBase = import.meta?.env?.VITE_API_BASE;
  const base = typeof rawBase === "string" ? rawBase.replace(/\/+$/, "") : "";
  return base ? `${base}${path}` : path;
};

const LiveKitWidget = ({ setShowSupport }) => {
  const [token, setToken] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetch(buildApiUrl('/api/config'));
      } catch (e) {
        console.error('Failed to fetch config', e);
      } finally {
        if (!cancelled) setLoadingConfig(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const getToken = useCallback(async () => {
    try {
      console.log("run");
      const response = await fetch(buildApiUrl(`/api/getToken?name=${encodeURIComponent("admin")}`));
      const token = await response.text();
      
      setToken(token);
      setIsConnecting(false);
    } catch (error) {
      console.error(error);
      setIsConnecting(false);
    }
  }, []);

  useEffect(() => {
    if (!loadingConfig) {
      getToken();
    }
  }, [getToken, loadingConfig]);

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
        ) : isConnecting ? (
          <div className="connecting-status">
            <h2>Connecting to support...</h2>
            <button
              type="button"
              className="cancel-button"
              onClick={() => setShowSupport(false)}
            >
              Cancel
            </button>
          </div>
        ) : token ? (
          <LiveKitRoom
            key={token}
            serverUrl={import.meta.env.VITE_LIVEKIT_URL}
            token={token}
            connect={true}
            video={false}
            audio={true}
            onDisconnected={() => {
              setShowSupport(false);
              setIsConnecting(true);
            }}
          >
            <RoomAudioRenderer />
            <AvatarVoiceAgent />
          </LiveKitRoom>
        ) : null}
      </div>
    </div>
  );
};

export default LiveKitWidget;