import { Avatar, Box, Menu, MenuProps } from "gandi-ui";
import * as React from "react";

import styles from "./MemberListItem.less";

interface Member extends OnlineUsers {
  isMuted: boolean;
  isSpeaking: boolean;
  isLocal: boolean;
  isMutedByAdmin: boolean;
}

const MemberListItem: React.FC<Member> = (member: Member) => {
  const items: MenuProps["items"] = [
    {
      key: "mute",
      label: "Mute",
      onClick: (e) => {
        console.log("Mute", e);
      },
    },
    {
      key: "kickOut",
      label: "Kick out",
      onClick: (e) => {
        console.log("Kick out", e);
      },
    },
  ];

  return (
    <Menu items={items} key={member.userInfo.id} contextMenu>
      <Box as="li" className={styles.memberListItem}>
        <Box as="div" className={styles.memberListItemInfo}>
          <Box as="div">
            <Avatar
              size="sm"
              name={member.userInfo.name}
              src={member.userInfo.avatar}
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
