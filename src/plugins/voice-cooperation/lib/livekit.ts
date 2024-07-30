import * as LiveKit from "livekit-client";
import config from "../config";

const VoiceServer = config.SERVER_URL; // localhost debug

async function connectToRoom(token: string, callback: (status: boolean, room?: LiveKit.Room) => void) {
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

  let globalReason = 0;

  room.on(LiveKit.RoomEvent.Disconnected, (reason) => {
    console.log("disconnected from room");

    if (reason === LiveKit.DisconnectReason.PARTICIPANT_REMOVED) {
      room.disconnect(true);
      globalReason = reason;
    }
    document.querySelectorAll(".voiceAudio").forEach((audio) => {
      audio.remove();
    });
    callback(false);
  });
  room.on(LiveKit.RoomEvent.Reconnecting, () => {
    globalReason == LiveKit.DisconnectReason.PARTICIPANT_REMOVED && room.disconnect(true);
  });
  return room;
}

export { connectToRoom };
