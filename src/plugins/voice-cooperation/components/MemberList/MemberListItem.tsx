import { Avatar, Box, Menu } from "@gandi-ide/gandi-ui";
import * as React from "react";

import styles from "./MemberListItem.less";
import { LocalizationContext, RoomContext, VoiceContext } from "../../index";

interface Member extends OnlineUsers {
  isMuted: boolean;
  isSpeaking: boolean;
  isLocal: boolean;
  isMutedByAdmin: boolean;
}

const MemberListItem: React.FC<Member> = (member: Member) => {
  const intl = React.useContext(LocalizationContext);
  const room = React.useContext(RoomContext);
  const voicePlugin = React.useContext(VoiceContext);
  const items = React.useMemo(() => {
    return [
      {
        key: "kickOut",
        isDisabled: member.isLocal || voicePlugin?.teamworkManager.userInfo.authority !== "ADMIN",
        label: intl.formatMessage({ id: "plugins.voiceCooperation.kick" }),
        onClick: () => {
          if (!room) return;
          voicePlugin.server.axios.post(
            `${voicePlugin.server.hosts.GANDI_MAIN}/rtc/removeParticipant`,
            {
              creationId: voicePlugin.teamworkManager.creationInfo.id,
              clientId: member.clientId,
            },
            {
              withCredentials: true,
            },
          );
        },
      },
    ];
  }, [member]);
  const getFormattedAvatarUrl = (url: string) => {
    // 判断url有无x-oss-process参数，有则替换，无则添加
    if (url.includes("x-oss-process")) {
      return url;
    } else {
      return encodeURI(url + "?x-oss-process=image/resize,s_150/format,webp");
    }
  };

  return (
    <Menu
      items={items}
      key={member.userInfo.id}
      sx={{
        "--menu-color-bg": "var(--theme-color-300)",
        "--menu-color-disabled-bg": "var(--theme-color-300)",
        "--menu-color-text": "var(--theme-text-primary)",
        "--menu-color-disabled-text": "var(--theme-color-g400)",
        button: {
          _hover: {
            background: "var(--theme-brand-color)",
          },
        },
      }}
      contextMenu
    >
      <Box as="li" className={styles.memberListItem}>
        <Box as="div" className={styles.memberListItemInfo}>
          <Box as="div">
            <Avatar
              size="sm"
              name={member.userInfo.name}
              src={getFormattedAvatarUrl(member.userInfo.avatar)}
              showBorder={member.isSpeaking}
              borderColor="#39c66c"
              style={{ borderStyle: "solid" }}
            />
          </Box>

          <Box as="div" className={styles.memberListItemName}>
            {member.userInfo.name}
          </Box>
        </Box>
      </Box>
    </Menu>
  );
};

export default MemberListItem;
export { Member, MemberListItem };
