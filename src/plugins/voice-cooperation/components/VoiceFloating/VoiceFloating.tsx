import { Box, Button, HStack, Tooltip } from "@gandi-ide/gandi-ui";
import * as React from "react";

import styles from "./VoiceFloating.less";
import ExpansionBox, { ExpansionRect } from "components/ExpansionBox";
import MemberListItem, { Member } from "../MemberList/MemberListItem";
import { IntlShape } from "react-intl";

import MicrophoneIcon from "../../../../assets/icon--voice--microphone.svg";
import MutedMicrophoneIcon from "../../../../assets/icon--voice--muted-microphone.svg";
import LeaveCallIcon from "../../../../assets/icon--voice--off.svg";
import ExpandIcon from "../../../../assets/icon--voice--expand.svg";

interface VoiceFloatingProps {
  intl: IntlShape;
  members: Array<Member>;
  onToggleMicrophone: () => void;
  isMicrophoneMuted: boolean;
  onLeave: () => void;
}

const VoiceFloating: React.FC<VoiceFloatingProps> = ({
  intl,
  members,
  onToggleMicrophone,
  isMicrophoneMuted,
  onLeave,
}) => {
  const [displayText, setDisplayText] = React.useState("");
  const [isExpanded, setExpanded] = React.useState(false);

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
    const maxHeight = Math.min(48 * members.length, 48 * 5);
    const newHeight = maxHeight + 63;
    return newHeight + 3;
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
  return (
    <ExpansionBox
      id="voice-floating"
      minWidth={173}
      minHeight={63}
      borderRadius={6}
      title={displayText}
      containerInfo={containerInfo}
      onSizeChange={(newSize) => {
        setExpanded(false);
        updateContainerInfo({
          ...newSize,
          height: 63,
        });
      }}
      className={styles.floatingWindow}
      canResize={false}
    >
      <Box
        style={{
          width: "100%",
          height: "auto",
        }}
      >
        <HStack
          w={containerInfo.width}
          spacing="auto"
          style={{
            display: "flex",
            alignItems: "center",
            padding: "2px 5px",
          }}
        >
          <Tooltip
            label={
              isMicrophoneMuted
                ? intl.formatMessage({ id: "plugins.voiceCooperation.mic.on" })
                : intl.formatMessage({ id: "plugins.voiceCooperation.mic.off" })
            }
          >
            <Button onClick={onToggleMicrophone} className={styles.button} size={"sm"} border="none">
              {!isMicrophoneMuted ? <MicrophoneIcon /> : <MutedMicrophoneIcon />}
            </Button>
          </Tooltip>
          <Tooltip label={intl.formatMessage({ id: "plugins.voiceCooperation.expand" })}>
            <Button onClick={() => setExpanded(!isExpanded)} size={"sm"} border="none" className={styles.button}>
              <ExpandIcon />
            </Button>
          </Tooltip>
          <Tooltip label={intl.formatMessage({ id: "plugins.voiceCooperation.leave" })}>
            <Button colorScheme={"red"} onClick={onLeave} size={"sm"} border="none" className={styles.leaveButton}>
              <LeaveCallIcon />
            </Button>
          </Tooltip>
        </HStack>
        {isExpanded && (
          <div
            style={{
              overflow: "overlay",
              maxHeight: 48 * 5 + 3, // 5 members, padding 3px
            }}
          >
            {members.map((member) => {
              return <MemberListItem key={member.userInfo.id} {...member} />;
            })}
          </div>
        )}
      </Box>
    </ExpansionBox>
  );
};

export default VoiceFloating;
