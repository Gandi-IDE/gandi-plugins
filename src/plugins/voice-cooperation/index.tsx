import * as React from "react";
import * as LiveKit from "livekit-client";
import styles from "./styles.less";
import ReactDOM from "react-dom";
import Tooltip from "components/Tooltip";
import VoiceIcon from "assets/icon--voice.svg";
import useStorageInfo from "hooks/useStorageInfo";
import { ExpansionRect } from "components/ExpansionBox";
import { GandiProvider } from "gandi-ui";
import VoiceDialog from "./componet/VoiceDialog";
import obtainToken from "./lib/auth";
import { connectToRoom } from "./lib/livekit";
import AudioElementWrapper from "./componet/AudioElementWrapper";
import { hotkeyIsDown, hotkeyIsUp } from "utils/hotkey-helper";
import { Member } from "./componet/MemberList/MemberListItem";
import VoiceFloating from "./componet/VoiceFloating/VoiceFloating";
import toast from "react-hot-toast";

const DEFAULT_CONTAINER_INFO = {
  width: 300,
  height: 450,
  translateX: 72,
  translateY: 60,
};

const DEFAULT_SETTINGS = {
  hotkeys: {
    ptt: ["ctrlKey", "K"],
  },
};

const VoiceCooperation: React.FC<PluginContext> = (PluginContext) => {
  const { msg, registerSettings } = PluginContext;
  const [shortcutKey, setShortcutKey] = React.useState(DEFAULT_SETTINGS.hotkeys.ptt);
  const [room, setRoom] = React.useState<LiveKit.Room>(null);
  const [voiceMemberList, setVoiceMemberList] = React.useState<Array<Member>>([]);

  React.useEffect(() => {
    if (shortcutKey.length) {
      const handler = (e: KeyboardEvent) => {
        if (!room) return;
        if (room.localParticipant.isMicrophoneEnabled) return;
        if (hotkeyIsDown(shortcutKey, e)) {
          e.preventDefault();
          console.log("down, set microphone to true");
          room.localParticipant.setMicrophoneEnabled(!room.localParticipant.isMicrophoneEnabled);
        }
      };
      const upHander = (e: KeyboardEvent) => {
        if (!room) return;
        if (hotkeyIsUp(shortcutKey, e)) {
          e.preventDefault();
          console.log("up, set microphone to false");
          room.localParticipant.setMicrophoneEnabled(false);
        }
      };
      window.addEventListener("keydown", handler);
      window.addEventListener("keyup", upHander);
      return () => {
        window.removeEventListener("keydown", handler);
        window.removeEventListener("keyup", upHander);
      };
    }
  }, [shortcutKey, room]);

  React.useEffect(() => {
    const register = registerSettings(
      msg("plugins.voiceCooperation.title"),
      "plugin-voice-cooperation",
      [
        {
          key: "actions",
          label: msg("plugins.voiceCooperation.settings.shortkey"),
          items: [
            {
              key: "ptt",
              label: msg("plugins.voiceCooperation.pushToTalk.title"),
              type: "hotkey",
              value: shortcutKey,
              onChange: (value: Array<string>) => {
                setShortcutKey(value);
              },
            },
          ],
        },
      ],
      VoiceIcon,
    );

    return () => {
      register.dispose();
    };
  }, [registerSettings]);

  const [visible, setVisible] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [containerInfo, setContainerInfo] = useStorageInfo<ExpansionRect>(
    "DEFAULT_VOICE_CONTAINER_INFO",
    DEFAULT_CONTAINER_INFO,
  );
  const containerInfoRef = React.useRef(containerInfo);
  const handleShow = React.useCallback(() => {
    setVisible(true);
  }, []);

  const handleClose = () => {
    setVisible(false);
  };

  const handleClick = async () => {
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
    window["pluginContext"] = PluginContext;
    const creationId = PluginContext.teamworkManager.creationInfo.id;
    const authority = PluginContext.teamworkManager.userInfo.authority;
    try {
      const tokenReq = await obtainToken(creationId, authority);
      if (tokenReq.data?.body?.token === undefined) {
        throw new Error(tokenReq.data.msg);
      }
      const token = tokenReq.data.body.token;
      console.log(token);
      connectToRoom(PluginContext, token, (connected: boolean, room: LiveKit.Room) => {
        if (connected) {
          setRoom(room);
        } else {
          setRoom(null);
          setVoiceMemberList([]);
        }
        setIsConnected(connected);
        setIsLoading(false);
        fetchCurrentUserList(room);
        roomEventRegister(room);
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
    console.log("fetching current user list");
    const tempList = []
    const localUser = PluginContext.teamworkManager.onlineUsers.get(PluginContext.teamworkManager.userInfo.clientId);
    if (!localUser) return;
    const localUserInfo = {
      ...localUser,
      isMuted: false,
      isSpeaking: false,
      isLocal: true,
      isMutedByAdmin: false,
    };
    tempList.push(localUserInfo);
    room.remoteParticipants.forEach((participant) => {
      debugger;
      const oid = participant.identity;
      const userInfo = Array.from(PluginContext.teamworkManager.onlineUsers).find(member => {
        return member[1].userId === oid;
      })[1];
      if (!userInfo) return;
      const remoteUserInfo = {
        ...userInfo,
        isMuted: false,
        isSpeaking: false,
        isLocal: false,
        isMutedByAdmin: false,
      };
      tempList.push(remoteUserInfo);
    });
    setVoiceMemberList(tempList);
    // // check if self in the room
    // const localId = room.localParticipant.identity;
    // voiceMemberList.find((element) => {
    //   return element.userId === localId;
    // }) ||
    //   setVoiceMemberList((pre) => {
    //     // find self in online user
    //     const self = PluginContext.teamworkManager.onlineUsers.get(PluginContext.teamworkManager.userInfo.clientId);
    //     console.log(self);
    //     if (!self) return pre;
    //     if (pre.some((element) => element.userId === self.userId)) return pre;
    //     const thisUser = {
    //       ...self,
    //       isMuted: false,
    //       isSpeaking: false,
    //       isLocal: true,
    //       isMutedByAdmin: false,
    //     };
    //     return [...pre, thisUser];
    //   });
    // room.remoteParticipants.forEach((participant) => {
    //   const oid = participant.identity;
    //   const userInfo = PluginContext.teamworkManager.onlineUsers;
    //   userInfo.forEach((element) => {
    //     if (element.userId === oid) {
    //       setVoiceMemberList((pre) => {
    //         const thisUser = {
    //           ...element,
    //           isMuted: false,
    //           isSpeaking: false,
    //           isLocal: false,
    //           isMutedByAdmin: false,
    //         };
    //         if (pre.some((element) => element.userId === thisUser.userId)) return pre;
    //         return [...pre, thisUser];
    //       });
    //     }
    //   });
    // });
    // // 判断有没有要删除的 之前的列表有现在没有的
    // setVoiceMemberList((pre) => {
    //   return pre.filter((element) => {
    //     return Array.from(room.remoteParticipants.values()).some((participant) => {
    //       return participant.identity === element.userId;
    //     });
    //   });
    // });
  };

  const roomEventRegister = (room: LiveKit.Room) => {
    room
      .on(LiveKit.RoomEvent.TrackSubscribed, handleNewTrack)
      .on(LiveKit.RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed);
    // .on(LiveKit.RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged)
  };

  const handleNewTrack = (track: LiveKit.RemoteAudioTrack) => {
    console.log("new track", track);
    track.attach(audioRef.current);
  };
  const handleTrackUnsubscribed = (track: LiveKit.RemoteAudioTrack) => {
    console.log("track removed", track);
    track.detach(audioRef.current);
  };

  React.useEffect(() => {
    const handleActiveSpeakersChanged = (speakers: Array<LiveKit.Participant>) => {
      console.log(speakers, voiceMemberList);
      const activeSpeakers = voiceMemberList.filter((member) =>
        speakers.some((speaker) => speaker.identity === member.userId),
      );

      console.log(activeSpeakers);

      setVoiceMemberList((prevList) =>
        prevList.map((member) => {
          if (activeSpeakers.some((active) => active.userId === member.userId)) {
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
      room
        ?.off(LiveKit.RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged)
        .off(LiveKit.RoomEvent.ParticipantConnected, () => fetchCurrentUserList(room))
        .off(LiveKit.RoomEvent.ParticipantDisconnected, () => fetchCurrentUserList(room));
    };
  }, [room, voiceMemberList]);

  React.useEffect(() => {
    return () => {
      room?.disconnect();
    };
  }, []);
  const containerRef = React.useRef(null);
  return ReactDOM.createPortal(
    <section className={styles.voiceRoot} ref={containerRef}>
      <Tooltip
        className={styles.voiceIcon}
        icon={<VoiceIcon />}
        onClick={handleShow}
        tipText={msg("plugins.voiceCooperation.title")}
      />
      {ReactDOM.createPortal(<AudioElementWrapper ref={audioRef} />, document.body)}
      {visible &&
        ReactDOM.createPortal(
          <GandiProvider>
            <VoiceDialog
              containerInfo={containerInfo}
              onClose={handleClose}
              onSizeChange={(value: ExpansionRect) => {
                containerInfoRef.current = value;
              }}
              msg={msg}
              onConnectClick={handleClick}
              isLoading={isLoading}
              isConnected={isConnected}
              member={voiceMemberList}
            />
          </GandiProvider>,
          document.body,
        )}
      {!visible && isConnected && ReactDOM.createPortal(
        <GandiProvider>
          <VoiceFloating intl={PluginContext.intl} members={voiceMemberList} />
        </GandiProvider>,
        document.body,
      )}
    </section>,
    document.querySelector("[class^='gandi_teamwork_wrapper']"),
  );
};

VoiceCooperation.displayName = "VoiceCooperation";

export default VoiceCooperation;
