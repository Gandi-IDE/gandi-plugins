import * as React from "react";
import * as LiveKit from "livekit-client";
import styles from "./styles.less";
import ReactDOM from "react-dom";
import VoiceIcon from "assets/icon--voice.svg";
import { Button, GandiProvider } from "@gandi-ide/gandi-ui";
import { connectToRoom } from "./lib/livekit";
import { Member } from "./components/MemberList/MemberListItem";
import toast from "react-hot-toast";
import classNames from "classnames";
import VoiceFloating from "./components/VoiceFloating/VoiceFloating";
import LeaveCallIcon from "assets/icon--voice--off-white.svg";
import { IntlShape } from "react-intl";
import { AxiosResponse } from "axios";

interface ITokenRequest {
  clientId: string;
  creationId: string;
  authority: string;
}

interface IResponse<T> {
  body: T;
  code: string;
  msg: string | null;
  status: number;
}

interface IToken {
  token: string;
}

const mentionAudio = new Audio(
  "https://zhishi.oss-cn-beijing.aliyuncs.com/user_projects_assets/65eea7ba445c03e8830c0e9e3280af13.mp3",
);
const newTeamMember = new Audio(
  "https://zhishi.oss-cn-beijing.aliyuncs.com/user_projects_assets/b6c6c4793d2636bfe24ce8c3a573c7f0.mp3",
);

const LocalizationContext = React.createContext<IntlShape>(null);
const RoomContext = React.createContext<LiveKit.Room>(null);
const VoiceContext = React.createContext<PluginContext>(null);
const VoiceCooperation: React.FC<PluginContext> = (PluginContext) => {
  const { msg } = PluginContext;
  const [room, setRoom] = React.useState<LiveKit.Room>(null);
  const [voiceMemberList, setVoiceMemberList] = React.useState<Array<Member>>([]);
  const roomRef = React.useRef<LiveKit.Room>();
  roomRef.current = room;

  const [isLoading, setIsLoading] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);

  const handleClick = async () => {
    setIsMuted(false);
    if (PluginContext.teamworkManager === null) {
      toast.error(msg("plugins.voiceCooperation.errorNotInCooperation"));
      return;
    }
    console.log("connecting to server");
    if (room !== null) {
      room.disconnect();
      return;
    }
    setIsLoading(true);
    const creationId = PluginContext.teamworkManager.creationInfo.id;
    const authority = PluginContext.teamworkManager.userInfo.authority;
    const clientId = PluginContext.teamworkManager.userInfo.clientId;
    try {
      const tokenReq = await PluginContext.server.axios.post<ITokenRequest, IToken>(
        `${PluginContext.server.hosts.GANDI_MAIN}/rtc/join`,
        {
          creationId: creationId,
          authority: authority,
          clientId: clientId,
        },
        {
          withCredentials: true,
        },
      );
      if (!tokenReq.token) {
        throw new Error();
      }
      const token = tokenReq.token;
      connectToRoom(token, (connected: boolean, room: LiveKit.Room) => {
        if (connected) {
          // 播放音效
          mentionAudio.play();
          setRoom(room);
        } else {
          setRoom(null);
          mentionAudio.play();
          setVoiceMemberList([]);
        }
        setIsConnected(connected);
        setIsLoading(false);
        fetchCurrentUserList(room);
        roomEventRegister(room);
        room.remoteParticipants.forEach((participant) => {
          if (participant.getTrackPublications().length > 0) {
            participant.getTrackPublications().forEach((track) => {
              if (track.kind === LiveKit.Track.Kind.Audio) {
                handleNewTrack(track.track as LiveKit.RemoteAudioTrack);
              }
            });
          }
        });
      });
    } catch (error) {
      setIsConnected(false);
      setIsLoading(false);
      setVoiceMemberList([]);
      setRoom(null);
      if (error instanceof LiveKit.PublishDataError) {
        toast.error(msg("plugins.voiceCooperation.errorMsgPermission"));
      }
      toast.error(msg("plugins.voiceCooperation.error"));
      console.error("Failed to obtain token", error);
    }
    return;
  };

  const fetchCurrentUserList = (room: LiveKit.Room) => {
    if (!room) return;
    if (room.state !== LiveKit.ConnectionState.Connected) return;
    const tempList = [];
    const localUser = PluginContext.teamworkManager.onlineUsers.get(PluginContext.teamworkManager.userInfo.clientId);
    if (!localUser) return;
    const localUserInfo = {
      ...localUser,
      isMuted: !room.localParticipant.isMicrophoneEnabled,
      isSpeaking: false,
      isLocal: true,
      isMutedByAdmin: false,
    };
    tempList.push(localUserInfo);
    room.remoteParticipants.forEach((participant) => {
      const cid = participant.identity;
      const userInfo = Array.from(PluginContext.teamworkManager.onlineUsers).find((member) => {
        return member[1].clientId === cid;
      })[1];
      if (!userInfo) return;
      const remoteUserInfo = {
        ...userInfo,
        isMuted: !participant.isMicrophoneEnabled,
        isSpeaking: false,
        isLocal: false,
        isMutedByAdmin: false,
      };
      tempList.push(remoteUserInfo);
    });
    setVoiceMemberList(tempList);
  };

  const roomEventRegister = (room: LiveKit.Room) => {
    room
      .on(LiveKit.RoomEvent.TrackSubscribed, handleNewTrack)
      .on(LiveKit.RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      .on(LiveKit.RoomEvent.TrackSubscribed, handleNewTrack)
      .on(LiveKit.RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      .on(LiveKit.RoomEvent.Reconnected, () => handleReconnect(room))
      .on(LiveKit.RoomEvent.TrackMuted, () => fetchCurrentUserList(room))
      .on(LiveKit.RoomEvent.TrackUnmuted, () => fetchCurrentUserList(room))
      .on(LiveKit.RoomEvent.ParticipantConnected, () => newTeamMember.play());
  };

  const handleNewTrack = (track: LiveKit.RemoteAudioTrack) => {
    console.log("new track", track);
    const element = track.attach();
    const parentElement = document.body;
    element.id = track.sid;
    element.classList.add("voiceAudio");
    parentElement.appendChild(element);
  };
  const handleTrackUnsubscribed = (track: LiveKit.RemoteAudioTrack) => {
    console.log("track removed", track);
    const element = track.detach();
    element.forEach((e) => {
      document.getElementById(e.id).remove();
    });
  };

  React.useEffect(() => {
    const handleActiveSpeakersChanged = (speakers: Array<LiveKit.Participant>) => {
      const activeSpeakers = voiceMemberList.filter((member) =>
        speakers.some((speaker) => speaker.identity === member.clientId),
      );

      setVoiceMemberList((prevList) =>
        prevList.map((member) => {
          if (activeSpeakers.some((active) => active.clientId === member.clientId)) {
            return { ...member, isSpeaking: true };
          } else {
            return { ...member, isSpeaking: false }; // 如果需要将其他用户的 isSpeaking 设置为 false
          }
        }),
      );
    };
    room
      ?.on(LiveKit.RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged)
      .on(LiveKit.RoomEvent.ParticipantConnected, () => fetchCurrentUserList(room))
      .on(LiveKit.RoomEvent.ParticipantDisconnected, () => fetchCurrentUserList(room));
    return () => {
      roomRef.current
        ?.off(LiveKit.RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged)
        .off(LiveKit.RoomEvent.ParticipantConnected, () => fetchCurrentUserList(room))
        .off(LiveKit.RoomEvent.ParticipantDisconnected, () => fetchCurrentUserList(room));
    };
  }, [room, voiceMemberList]);

  const handleReconnect = (room: LiveKit.Room) => {
    setIsConnected(true);
    setIsLoading(false);
    fetchCurrentUserList(room);
    setRoom(room);
  };
  React.useEffect(() => {
    return () => {
      const cleanup = async () => {
        await roomRef.current.disconnect();
      };
      cleanup();
      setRoom(null);
      // PostAction: cleanup room
    };
  }, []);
  const containerRef = React.useRef(null);
  const onLeave = () => {
    if (room) {
      room.disconnect();
    }
  };
  const onToggleMicrophone = () => {
    if (room) {
      room.localParticipant.setMicrophoneEnabled(!room.localParticipant.isMicrophoneEnabled).then(
        () => {
          setIsMuted(!room.localParticipant.isMicrophoneEnabled);
        },
        (e) => {
          console.error("Failed to toggle microphone", e);
        },
      );
    }
  };
  React.useEffect(() => {
    const element = document.createElement("div");
    element.id = "audioFloatingWrapper";
    document.body.appendChild(element);
    return () => {
      document.body.removeChild(element);
    };
  }, []);

  const [isMuted, setIsMuted] = React.useState(false);
  return ReactDOM.createPortal(
    <VoiceContext.Provider value={PluginContext}>
      <RoomContext.Provider value={room}>
        <LocalizationContext.Provider value={PluginContext.intl}>
          <GandiProvider
            resetCSS={false}
            theme={{
              styles: {
                global: {
                  body: {
                    color: "unset",
                  },
                },
              },
            }}
          >
            <section className={styles.voiceRoot} ref={containerRef}>
              <Button
                className={classNames({
                  [styles.voiceButton]: true,
                  [styles.voiceButtonConnected]: isConnected || isLoading,
                })}
                colorScheme="green"
                border={"none"}
                size={"lg"}
                onClick={isConnected ? onLeave : handleClick}
                isLoading={isLoading}
              >
                <span className={styles.voiceIcon}>{isConnected ? <LeaveCallIcon /> : <VoiceIcon />}</span>
                {!isConnected && <div className={styles.join}>{msg("plugins.voiceCooperation.join")}</div>}
              </Button>

              {isConnected &&
                ReactDOM.createPortal(
                  <VoiceFloating
                    intl={PluginContext.intl}
                    members={voiceMemberList}
                    isMicrophoneMuted={isMuted}
                    onToggleMicrophone={onToggleMicrophone}
                    onLeave={onLeave}
                  />,
                  document.getElementById("audioFloatingWrapper"),
                )}
            </section>
          </GandiProvider>
        </LocalizationContext.Provider>
      </RoomContext.Provider>
    </VoiceContext.Provider>,
    document.querySelector("[class^='gandi_teamwork_wrapper']"),
  );
};

VoiceCooperation.displayName = "VoiceCooperation";

export { VoiceCooperation as default, LocalizationContext, RoomContext, VoiceContext };
