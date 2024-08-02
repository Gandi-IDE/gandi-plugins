import { Avatar, AvatarGroup, Box, Button } from "@gandi-ide/gandi-ui";
import * as React from "react";

import styles from "./VoiceFloatingNew.less";
import { ExpansionRect } from "components/ExpansionBox";
import MemberListItem, { Member } from "../MemberList/MemberListItem";
import { IntlShape } from "react-intl";
import UparrowIcon from "../../../../assets/icon--voice--uparrow.svg";
import DownarrowIcon from "../../../../assets/icon--voice--downarrow.svg";
import Draggable from "react-draggable";
import { VoiceContext } from "plugins/voice-cooperation";
import { MicrophoneSlashIcon, MicrophoneIcon } from "@gandi-ide/gandi-ui/dist/Icon";

interface VoiceFloatingProps {
  intl: IntlShape;
  members: Array<Member>;
  onToggleMicrophone: () => void;
  isMicrophoneMuted: boolean;
  onLeave: () => void;
}

const mockMembers: Array<Member> = [
  {
    ownsScope: true,
    authority: "ADMIN",
    userId: "619b9141e0c34311283fd4d8",
    clientId: "OYn1Txmf6Z8saoBBKkW6y",
    scope: [],
    userInfo: {
      avatar: "https://m.ccw.site/avatar/619b9141e0c34311283fd4d8/27b2a870-5bc2-4e29-a046-23389b1eb042.png",
      authority: "ADMIN",
      id: "619b9141e0c34311283fd4d8",
      name: "SparrowHe",
      role: "ALL",
      online: true,
      color: "#2D8CFF",
    },
    editingTargetId: "gP4@WLB8/..sng-]CKcb",
    isMuted: false,
    isSpeaking: true,
    isLocal: true,
    isMutedByAdmin: false,
  },
  {
    ownsScope: true,
    authority: "ADMIN",
    userId: "619b9141e0c34311283fd4d8",
    clientId: "OYn1Txmf6Z8saoBBKkW6y",
    scope: [],
    userInfo: {
      avatar: "https://m.ccw.site/avatar/619b9141e0c34311283fd4d8/27b2a870-5bc2-4e29-a046-23389b1eb042.png",
      authority: "ADMIN",
      id: "619b9141e0c34311283fd4d8",
      name: "SparrowHe",
      role: "ALL",
      online: true,
      color: "#2D8CFF",
    },
    editingTargetId: "gP4@WLB8/..sng-]CKcb",
    isMuted: false,
    isSpeaking: true,
    isLocal: false,
    isMutedByAdmin: false,
  },
  {
    ownsScope: true,
    authority: "ADMIN",
    userId: "619b9141e0c34311283fd4d8",
    clientId: "OYn1Txmf6Z8saoBBKkW6y",
    scope: [],
    userInfo: {
      avatar: "https://m.ccw.site/avatar/619b9141e0c34311283fd4d8/27b2a870-5bc2-4e29-a046-23389b1eb042.png",
      authority: "ADMIN",
      id: "619b9141e0c34311283fd4d8",
      name: "SparrowHe",
      role: "ALL",
      online: true,
      color: "#2D8CFF",
    },
    editingTargetId: "gP4@WLB8/..sng-]CKcb",
    isMuted: false,
    isSpeaking: true,
    isLocal: false,
    isMutedByAdmin: false,
  },
  {
    ownsScope: true,
    authority: "ADMIN",
    userId: "619b9141e0c34311283fd4d8",
    clientId: "OYn1Txmf6Z8saoBBKkW6y",
    scope: [],
    userInfo: {
      avatar: "https://m.ccw.site/avatar/619b9141e0c34311283fd4d8/27b2a870-5bc2-4e29-a046-23389b1eb042.png",
      authority: "ADMIN",
      id: "619b9141e0c34311283fd4d8",
      name: "SparrowHe",
      role: "ALL",
      online: true,
      color: "#2D8CFF",
    },
    editingTargetId: "gP4@WLB8/..sng-]CKcb",
    isMuted: false,
    isSpeaking: true,
    isLocal: false,
    isMutedByAdmin: false,
  },
  {
    ownsScope: true,
    authority: "ADMIN",
    userId: "619b9141e0c34311283fd4d8",
    clientId: "OYn1Txmf6Z8saoBBKkW6y",
    scope: [],
    userInfo: {
      avatar: "https://m.ccw.site/avatar/619b9141e0c34311283fd4d8/27b2a870-5bc2-4e29-a046-23389b1eb042.png",
      authority: "ADMIN",
      id: "619b9141e0c34311283fd4d8",
      name: "SparrowHe",
      role: "ALL",
      online: true,
      color: "#2D8CFF",
    },
    editingTargetId: "gP4@WLB8/..sng-]CKcb",
    isMuted: false,
    isSpeaking: true,
    isLocal: false,
    isMutedByAdmin: false,
  },
  {
    ownsScope: true,
    authority: "ADMIN",
    userId: "619b9141e0c34311283fd4d8",
    clientId: "OYn1Txmf6Z8saoBBKkW6y",
    scope: [],
    userInfo: {
      avatar: "https://m.ccw.site/avatar/619b9141e0c34311283fd4d8/27b2a870-5bc2-4e29-a046-23389b1eb042.png",
      authority: "ADMIN",
      id: "619b9141e0c34311283fd4d8",
      name: "SparrowHe",
      role: "ALL",
      online: true,
      color: "#2D8CFF",
    },
    editingTargetId: "gP4@WLB8/..sng-]CKcb",
    isMuted: false,
    isSpeaking: true,
    isLocal: false,
    isMutedByAdmin: false,
  },
  {
    ownsScope: true,
    authority: "ADMIN",
    userId: "619b9141e0c34311283fd4d8",
    clientId: "OYn1Txmf6Z8saoBBKkW6y",
    scope: [],
    userInfo: {
      avatar: "https://m.ccw.site/avatar/619b9141e0c34311283fd4d8/27b2a870-5bc2-4e29-a046-23389b1eb042.png",
      authority: "ADMIN",
      id: "619b9141e0c34311283fd4d8",
      name: "SparrowHe",
      role: "ALL",
      online: true,
      color: "#2D8CFF",
    },
    editingTargetId: "gP4@WLB8/..sng-]CKcb",
    isMuted: false,
    isSpeaking: true,
    isLocal: false,
    isMutedByAdmin: false,
  },
];

const VoiceFloatingNew: React.FC<VoiceFloatingProps> = ({
  intl,
  members,
  onToggleMicrophone,
  isMicrophoneMuted,
  onLeave,
}) => {
  // const members = mockMembers;
  const [displayText, setDisplayText] = React.useState("");
  const [isExpanded, setExpanded] = React.useState(false);
  const voicePlugin = React.useContext(VoiceContext);

  const [containerInfo, updateContainerInfo] = React.useState<ExpansionRect>({
    width: 165,
    height: 63,
    translateX: 1000,
    translateY: 100,
  });

  const truncateList = (list: Array<Member>, max: number) => {
    if (list.length <= max) {
      return list;
    }
    return list.slice(0, max);
  };

  const extractMemberName = (members: Array<Member>, length: number) => {
    // 截断到length位名字
    const names = members.map((member) => member.userInfo.name);
    const fullList = names.join(", ");
    if (fullList.length <= length) {
      return fullList;
    } else {
      return fullList.slice(0, length) + "...";
    }
  };

  const displayString = (members: Array<Member>, max: number) => {
    const member = members.filter((member) => member.isSpeaking);
    if (member.length == 0) {
      return intl.formatMessage({ id: "plugins.voiceCooperation.noOne" });
    }
    if (member.length == 1) {
      return intl.formatMessage(
        { id: "plugins.voiceCooperation.speakingOne" },
        { name: member[0].userInfo.name.slice(0, 10) },
      );
    }
    const truncatedList = truncateList(member, max);
    const names = extractMemberName(truncatedList, 10);
    const fullString = intl.formatMessage(
      { id: "voice.voiceCooperation.speaking" },
      { names, count: member.length - max },
    );
    return fullString;
  };

  const getNewHeight = React.useCallback(() => {
    const maxHeight = Math.min(44 * members.length + 8 * 2); // 44是每个item的高度，8是padding
    return maxHeight;
  }, [members]);

  React.useEffect(() => {
    if (!isExpanded) {
      updateContainerInfo({
        ...containerInfo,
        height: 63,
      });
      return;
    }
    const newHeight = getNewHeight();
    updateContainerInfo({
      ...containerInfo,
      height: newHeight,
    });
  }, [isExpanded]);

  React.useEffect(() => {
    setDisplayText(displayString(members, 3));
  }, [members, intl]);
  const containerInfoRef = React.useRef(containerInfo);
  React.useEffect(() => {
    // 获取指定元素位置
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const x = (windowWidth - containerInfoRef.current.width) / 2;
    const y = (windowHeight - containerInfoRef.current.height) / 2;
    updateContainerInfo({
      ...containerInfoRef.current,
      translateX: x,
      translateY: y,
    });
  }, []);
  React.useEffect(() => {
    if (isExpanded) {
      // 已经展开，需要更新高度
      const newHeight = getNewHeight();
      updateContainerInfo({
        ...containerInfo,
        height: newHeight,
      });
    }
  }, [members]);
  const handleToggle = React.useCallback(() => {
    setExpanded(!isExpanded);
  }, [isExpanded]);
  const [position, setPosition] = React.useState({ x: 800, y: 300 });
  const zIndex = 101;
  const container = React.useRef<HTMLDivElement>(null);
  const handleBringToFront = React.useCallback(() => {
    const minIndex = typeof zIndex === "undefined" ? 101 : zIndex;
    const nodes = document.getElementsByClassName(styles.container);
    [...nodes]
      .map((node: HTMLElement) => ({
        index: window.getComputedStyle(node)["z-index"],
        node,
      }))
      .sort((a, b) => a.index - b.index)
      .forEach((item, index) => {
        if (item.node === container.current) {
          item.node.style["z-index"] = nodes.length + minIndex;
        } else {
          item.node.style["z-index"] = index + 101;
        }
      });
  }, [zIndex]);
  return (
    <Draggable
      handle={`.${styles.titleBox}`}
      bounds={{
        top: 60,
        left: 72,
      }}
      position={position}
      onDrag={(_, data) => {
        setPosition({ x: data.x, y: data.y });
      }}
      onStop={() => handleBringToFront()}
    >
      <div className={styles.container} ref={container}>
        <Box className={styles.titleBox}>
          {isExpanded && <span className={styles.title}>{voicePlugin.msg("plugins.voiceCooperation.title")}</span>}
          {!isExpanded && (
            <div className={styles.minimalContainer}>
              <AvatarGroup className={styles.avatarGroup} max={5} size="xs">
                {members
                  .filter((member) => member.isSpeaking)
                  .map((member) => {
                    return (
                      <Avatar
                        key={member.userInfo.id}
                        name={member.userInfo.name}
                        src={member.userInfo.avatar}
                        sx={{
                          width: "24px",
                          height: "24px",
                        }}
                      />
                    );
                  })}
              </AvatarGroup>
              <div>
                {members.filter((member) => member.isSpeaking).length === 1 && (
                  <div className={styles.speakingTipsContainer}>
                    <span className={styles.username}>
                      {members.filter((member) => member.isSpeaking)[0].userInfo.name}
                      {members.filter((member) => member.isSpeaking)[0].clientId ===
                        voicePlugin.teamworkManager.userInfo.clientId && <span>&nbsp;(You)</span>}
                    </span>
                    <span className={styles.tip}>{voicePlugin.msg("plugins.voiceCooperation.speakingOnly")}</span>
                  </div>
                )}
                {members.filter((member) => member.isSpeaking).length > 1 && (
                  <div className={styles.speakingTipsContainer}>
                    <span className={styles.tip}>{voicePlugin.msg("plugins.voiceCooperation.speakingOnly")}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className={styles.buttonGroup}>
            <Button
              className={styles.controlButton}
              sx={{
                width: 24,
                height: 24,
                p: 0,
              }}
              onClick={onToggleMicrophone}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                }}
              >
                {isMicrophoneMuted ? (
                  <MicrophoneSlashIcon color="red" />
                ) : (
                  <MicrophoneIcon
                    sx={{
                      color: "var(--theme-color-g300)",
                    }}
                  />
                )}
              </span>
            </Button>
            <Button
              className={styles.controlButton}
              sx={{
                width: 24,
                height: 24,
                p: 0,
              }}
              onClick={handleToggle}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                }}
              >
                {isExpanded ? <UparrowIcon /> : <DownarrowIcon />}
              </span>
            </Button>
          </div>
        </Box>
        {isExpanded && (
          <div>
            <div className={styles.divider}></div>
            <Box id="voice-floating">
              <div
                style={{
                  overflow: "overlay",
                  maxHeight: 236,
                }}
                className={styles.memberContainer}
              >
                {members.map((member) => {
                  return (
                    <MemberListItem key={member.userInfo.id} {...member} onToggleMicrophone={onToggleMicrophone} />
                  );
                })}
              </div>
            </Box>
            <div className={styles.divider}></div>
            <Button className={styles.leaveButton} variant="ghost" onClick={onLeave}>
              退出语音协作
            </Button>
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default VoiceFloatingNew;
