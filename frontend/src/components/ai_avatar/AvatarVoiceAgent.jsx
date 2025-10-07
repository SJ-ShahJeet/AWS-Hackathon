import {
  useVoiceAssistant,
  BarVisualizer,
  VoiceAssistantControlBar,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { useTracks, VideoTrack } from '@livekit/components-react';
import "./AvatarVoiceAgent.css";

const AvatarVoiceAgent = () => {
  const { state, audioTrack } = useVoiceAssistant();
  const trackRefs = useTracks([Track.Source.Camera]);
  const remoteCamTrackRef = trackRefs.find((trackRef) => !trackRef.participant.isLocal);

  return (
    <div className="voice-assistant-container">
      <div className="visualizer-container">
        <BarVisualizer state={state} barCount={5} trackRef={audioTrack} />
      </div>
      <>
      {remoteCamTrackRef ? <VideoTrack trackRef={remoteCamTrackRef} /> : <div>Calling the Concierge...</div>}
      </>
      <div className="control-section">
        <VoiceAssistantControlBar />
      </div>
    </div>
  );
};

export default AvatarVoiceAgent;
