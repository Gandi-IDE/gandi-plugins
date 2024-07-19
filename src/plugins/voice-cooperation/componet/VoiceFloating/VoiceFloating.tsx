import { Box, Text } from "gandi-ui";
import * as React from "react";

import styles from "./VoiceFloating.less";
import ExpansionBox, { ExpansionRect } from "components/ExpansionBox";
import { Member } from "../MemberList/MemberListItem";
import { IntlShape } from "react-intl";

interface VoiceFloatingProps {
  intl: IntlShape;
  members: Array<Member>;
}

const VoiceFloating: React.FC<VoiceFloatingProps> = ({ intl, members }) => {
  const [displayText, setDisplayText] = React.useState("");

  const [containerInfo, updateContainerInfo] = React.useState<ExpansionRect>({
    width: 285,
    height: 30,
    translateX: 72,
    translateY: 60,
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
    const fullString = intl.formatMessage({ id: "voice.floating.speaking" }, { names, count: member.length - max });
    return fullString;
  };

  React.useEffect(() => {
    setDisplayText(displayString(members, 3));
  }, [members, intl]);

  return (
    <ExpansionBox
      id="voice-floating"
      minWidth={285}
      minHeight={50}
      borderRadius={6}
      title="Voice"
      containerInfo={containerInfo}
      onClose={() => {}}
      onSizeChange={(newSize) => {
        updateContainerInfo(newSize);
      }}
      className={styles.floatingWindow}
    >
      <Box>
        <Text size="sm" style={{
          padding: "0 10px",
        }}>{displayText}</Text>
      </Box>
    </ExpansionBox>
  );
};

export default VoiceFloating;
