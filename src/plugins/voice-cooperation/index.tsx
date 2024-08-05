import * as React from "react";
import * as LiveKit from "livekit-client";
import styles from "./styles.less";
import ReactDOM from "react-dom";
import VoiceIcon from "assets/icon--voice.svg";
import { Button, GandiProvider, Tooltip, useMessage } from "@gandi-ide/gandi-ui";
import { connectToRoom } from "./lib/livekit";
import { Member } from "./components/MemberList/MemberListItem";
import classNames from "classnames";
import LeaveCallIcon from "assets/icon--voice--off-white.svg";
import { IntlShape } from "react-intl";
import VoiceFloatingNew from "./components/VoiceFloatingNew/VoiceFloatingNew";
import dots from "./dots.less";

const globalCss = `
:root[theme=light] {
    --voice-plugin-divider: #DCE0E5;
    --voice-plugin-button: #6B7280;
    --voice-plugin-border: #DCE0E5;
    --voice-plugin-bg: #F7F7F7;
    --voice-plugin-hover: rgba(156, 163, 175, 0.16);
}

:root[theme=dark] {
    --voice-plugin-divider: #3E495B;
    --voice-plugin-button: #D1D5DB;
    --voice-plugin-border: #3E495B;
    --voice-plugin-bg: #F7F7F7;
    --voice-plugin-hover: rgba(156, 163, 175, 0.15);
}`;

interface ITokenRequest {
  clientId: string;
  creationId: string;
  authority: string;
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
  const toast = useMessage({ followCursor: true });
  const { msg } = PluginContext;
  const [room, setRoom] = React.useState<LiveKit.Room>(null);
  const [voiceMemberList, setVoiceMemberList] = React.useState<Array<Member>>([]);
  const roomRef = React.useRef<LiveKit.Room>();
  roomRef.current = room;

  const [isLoading, setIsLoading] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);
  React.useEffect(() => {
    // 注入css
    const style = document.createElement("style");
    style.innerHTML = globalCss;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  const handleClick = async () => {
    setIsMuted(false);
    if (PluginContext.teamworkManager === null) {
      toast(msg("plugins.voiceCooperation.errorNotInCooperation"), {
        status: "error",
        duration: 5000,
      });
      return;
    }
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
        toast(msg("plugins.voiceCooperation.errorMsgPermission"), {
          status: "error",
          duration: 5000,
        });
      }
      toast(msg("plugins.voiceCooperation.error"), {
        status: "error",
        duration: 5000,
      });
      console.error("Failed to obtain token", error);
    }
    return;
  };
  const handleParticipantChanged = React.useCallback(() => {
    if (room) {
      fetchCurrentUserList(room);
    }
  }, [room]);
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
      ?.on(LiveKit.RoomEvent.TrackSubscribed, handleNewTrack)
      .on(LiveKit.RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      .on(LiveKit.RoomEvent.TrackSubscribed, handleNewTrack)
      .on(LiveKit.RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      .on(LiveKit.RoomEvent.Reconnected, () => handleReconnect(room))
      .on(LiveKit.RoomEvent.TrackMuted, () => fetchCurrentUserList(room))
      .on(LiveKit.RoomEvent.TrackUnmuted, () => fetchCurrentUserList(room))
      .on(LiveKit.RoomEvent.ParticipantConnected, () => newTeamMember.play());
  };

  const handleNewTrack = (track: LiveKit.RemoteAudioTrack) => {
    fetchCurrentUserList(roomRef.current);
    const element = track.attach();
    const parentElement = document.body;
    element.id = track.sid;
    element.classList.add("voiceAudio");
    parentElement.appendChild(element);
  };
  const handleTrackUnsubscribed = (track: LiveKit.RemoteAudioTrack) => {
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
      .on(LiveKit.RoomEvent.ParticipantConnected, handleParticipantChanged)
      .on(LiveKit.RoomEvent.ParticipantDisconnected, handleParticipantChanged);
    return () => {
      roomRef.current
        ?.off(LiveKit.RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged)
        .off(LiveKit.RoomEvent.ParticipantConnected, handleParticipantChanged)
        .off(LiveKit.RoomEvent.ParticipantDisconnected, handleParticipantChanged);
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
        await roomRef.current?.disconnect();
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
  if (!PluginContext.teamworkManager) {
    return null;
  }
  return ReactDOM.createPortal(
    <VoiceContext.Provider value={PluginContext}>
      <RoomContext.Provider value={room}>
        <LocalizationContext.Provider value={PluginContext.intl}>
          <GandiProvider
            resetCSS={false}
            theme={{
              semanticTokens: {
                colors: {
                  "bg-module": {
                    _dark: "var(--theme-color-600)",
                    _light: "var(--theme-color-600)",
                  },
                },
              },
              styles: {
                global: {
                  body: {
                    color: "unset",
                  },
                },
              },
              components: {
                Tooltip: {
                  baseStyle: {
                    "--tooltip-bg": "var(--theme-color-600)",
                    "--popper-arrow-bg": "var(--theme-color-600)",
                    background: "var(--theme-color-600)",
                    height: "44px",
                    padding: "0 16px",
                    border: "var(--theme-border-size-tip) solid var(--theme-border-color-tip)",
                    "border-radius": "8px",
                    "box-shadow": "0px 4px 4px rgba(0, 0, 0, 0.25)",
                    transform: "translate(-50%, 0)",
                    "white-space": "nowrap",
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "space-between",
                  },
                },
                Menu: {
                  baseStyle: {
                    background: "var(--voice-plugin-bg)",
                    "--menu-color-disabled-bg": "var(--theme-color-300)",
                    "--menu-color-text": "var(--theme-text-primary)",
                    "--menu-color-disabled-text": "var(--theme-color-g400)",
                    width: "104px",
                    button: {
                      _hover: {
                        background: "var(--theme-brand-color)",
                      },
                    },
                  },
                },
              },
            }}
          >
            <section className={styles.voiceRoot} ref={containerRef}>
              <Tooltip
                label={isConnected && msg("plugins.voiceCooperation.leave")}
                // sx={{
                //   "--tooltip-bg": "var(--theme-color-600)",
                // }}
              >
                <Button
                  className={classNames({
                    [styles.voiceButton]: true,
                    [styles.voiceButtonConnected]: isConnected,
                    [styles.voiceButtonLoading]: isLoading,
                  })}
                  colorScheme="green"
                  border={"none"}
                  size={"lg"}
                  onClick={isConnected ? onLeave : handleClick}
                  disabled={isLoading}
                  sx={{
                    height: "36px",
                    borderRadius: "6px",
                  }}
                >
                  <span className={styles.buttonIcon}>
                    {isConnected && <LeaveCallIcon />}
                    {!isConnected && !isLoading && <VoiceIcon />}
                    {isLoading && (
                      <div
                        className={dots.loadingDots}
                        style={{
                          width: "18px !important",
                          height: "18px !important",
                          // display: "flex",
                          // alignItems: "center",
                        }}
                      >
                        <div></div>
                        <div></div>
                        <div></div>
                      </div>
                    )}
                  </span>
                  {!isConnected && !isLoading && (
                    <div className={styles.join}>{msg("plugins.voiceCooperation.join")}</div>
                  )}
                </Button>
              </Tooltip>
              {isConnected &&
                ReactDOM.createPortal(
                  <VoiceFloatingNew
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
