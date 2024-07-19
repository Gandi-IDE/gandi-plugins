import * as LiveKit from "livekit-client";

const VoiceServer = "ws://localhost:7880"; // localhost debug

async function connectToRoom(
  pluginContext: PluginContext,
  token: string,
  callback: (status: boolean, room?: LiveKit.Room) => void,
) {
  const room = new LiveKit.Room({
    dynacast: true, // optimize publish bandwidth and CPU for published tracks
    publishDefaults: {
      audioPreset: LiveKit.AudioPresets.telephone,
      stopMicTrackOnMute: true,
    },
  });
  try {
    await room.connect(VoiceServer, token);
    await room.localParticipant.setMicrophoneEnabled(true);
    callback(true, room);
  } catch (error) {
    room.disconnect(true);
    console.error("failed to connect to room", error);
    callback(false);
    return null;
  }

  room.on(LiveKit.RoomEvent.Disconnected, () => {
    console.log("disconnected from room");
    callback(false);
  });
  room.on(LiveKit.RoomEvent.TrackSubscribed, (track, publication, participant) => {
    console.log(`subscribed to track ${track.sid} from ${participant.identity}`);
  });
  return room;
}

export { connectToRoom };
