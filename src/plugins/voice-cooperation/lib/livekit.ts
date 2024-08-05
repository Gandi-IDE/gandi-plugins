import * as LiveKit from "livekit-client";
import type { ReconnectContext, ReconnectPolicy } from "livekit-client/dist/src/room/ReconnectPolicy";
import config from "../config";

const VoiceServer = config.SERVER_URL; // localhost debug
let globalReason = 0;
async function connectToRoom(token: string, callback: (status: boolean, room?: LiveKit.Room) => void) {
  const room = new LiveKit.Room({
    dynacast: true, // optimize publish bandwidth and CPU for published tracks
    publishDefaults: {
      audioPreset: LiveKit.AudioPresets.telephone,
      stopMicTrackOnMute: true,
    },
    reconnectPolicy: new CustomReconnectPolicy(),
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

  room.on(LiveKit.RoomEvent.Disconnected, (reason) => {
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

const maxRetryDelay = 7000;

const DEFAULT_RETRY_DELAYS_IN_MS = [
  0,
  300,
  2 * 2 * 300,
  3 * 3 * 300,
  4 * 4 * 300,
  maxRetryDelay,
  maxRetryDelay,
  maxRetryDelay,
  maxRetryDelay,
  maxRetryDelay,
];

class CustomReconnectPolicy implements ReconnectPolicy {
  private readonly _retryDelays: number[];

  constructor(retryDelays?: number[]) {
    this._retryDelays = retryDelays !== undefined ? [...retryDelays] : DEFAULT_RETRY_DELAYS_IN_MS;
  }

  public nextRetryDelayInMs(context: ReconnectContext): number | null {
    if (globalReason == LiveKit.DisconnectReason.PARTICIPANT_REMOVED) return null;
    if (context.retryCount >= this._retryDelays.length) return null;

    const retryDelay = this._retryDelays[context.retryCount];
    if (context.retryCount <= 1) return retryDelay;

    return retryDelay + Math.random() * 1_000;
  }
}


export { connectToRoom };
