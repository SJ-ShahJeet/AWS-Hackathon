import {
  useVoiceAssistant,
  BarVisualizer,
  VoiceAssistantControlBar,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { useTracks, VideoTrack } from '@livekit/components-react';
import AvatarChatPanel from "./AvatarChatPanel";
import "./AvatarVoiceAgent.css";

const AvatarVoiceAgent = () => {
  const { state, audioTrack } = useVoiceAssistant();
  const trackRefs = useTracks([Track.Source.Camera]);
  const remoteCamTrackRef = trackRefs.find((trackRef) => !trackRef.participant.isLocal);

  const avatarLoaded = !!remoteCamTrackRef;

  return (
    <div className="voice-assistant-container">
      {!avatarLoaded && (
        <div className="visualizer-container">
          <BarVisualizer state={state} barCount={5} trackRef={audioTrack} />
        </div>
      )}
      <div className="avatar-video">
        {avatarLoaded ? <VideoTrack trackRef={remoteCamTrackRef} /> : <div>Calling the Concierge...</div>}
      </div>
      <div className="control-section">
        <VoiceAssistantControlBar />
      </div>
      <AvatarChatPanel />
    </div>
  );
};

export default AvatarVoiceAgent;
