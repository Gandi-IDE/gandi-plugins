import { Avatar, Box, Menu, MenuButton } from "@gandi-ide/gandi-ui";
import * as React from "react";

import styles from "./MemberListItem.less";
import { LocalizationContext, RoomContext, VoiceContext } from "../../index";
import MutedMicrophoneIcon from "../../../../assets/icon--voice--muted-microphone.svg";
import VoiceSettingIcon from "../../../../assets/icon--voice--setting.svg";
import IF from "components/IF";
import { MicrophoneSlashIcon, MicrophoneIcon } from "@gandi-ide/gandi-ui/dist/Icon";
import classNames from "classnames";
interface Member extends OnlineUsers {
  isMuted: boolean;
  isSpeaking: boolean;
  isLocal: boolean;
  isMutedByAdmin: boolean;
  onToggleMicrophone?: () => void;
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

  const handleActionButtonClick = React.useCallback(() => {
    if (member.clientId === voicePlugin.teamworkManager.userInfo.clientId) {
      if (member.onToggleMicrophone) {
        member.onToggleMicrophone();
      }
    } else if (voicePlugin.teamworkManager.userInfo.authority === "ADMIN") {
      // TODO: 打开menu
    }
  }, [member.onToggleMicrophone]);

  return (
    <>
      <Box as="li" className={styles.memberListItem}>
        <Box as="div" className={styles.memberListItemInfo}>
          <Box as="div">
            <Avatar
              sx={{
                width: "28px",
                height: "28px",
                "--gandi-colors-bg-module": "var(--theme-color-300)",
              }}
              name={member.userInfo.name}
              src={getFormattedAvatarUrl(member.userInfo.avatar)}
              style={{ borderStyle: "solid" }}
              badgeSx={{
                width: "12px",
                height: "12px",
              }}
              badgeIcon={
                member.isSpeaking ? (
                  <MicrophoneIcon
                    viewBox="0 0 24 24"
                    color="#39c66c"
                    style={{
                      width: 12,
                      height: 12,
                    }}
                  />
                ) : (
                  member.isMuted && (
                    <MicrophoneSlashIcon
                      viewBox="0 0 24 24"
                      color="#fa594c"
                      style={{
                        width: 12,
                        height: 12,
                      }}
                    />
                  )
                )
              }
            />
          </Box>

          <Box as="div" className={styles.memberListItemName}>
            {member.userInfo.name}
            {member.clientId === voicePlugin.teamworkManager.userInfo.clientId && (
              <span className={styles.local}>&nbsp;({voicePlugin.msg("plugins.voiceCooperation.you")})</span>
            )}
          </Box>

          <IF condition={member.isLocal}>
            <Box as="div" className={styles.memberListItemAction} onClick={handleActionButtonClick}>
              {!member.isMuted ? (
                <MicrophoneIcon
                  sx={{
                    color: "var(--voice-plugin-button)",
                  }}
                />
              ) : (
                <MicrophoneSlashIcon color="#fa594c" />
              )}
            </Box>
          </IF>
          <IF condition={!member.isLocal && voicePlugin.teamworkManager.userInfo.authority === "ADMIN"}>
            <Box
              as="div"
              className={classNames(styles.memberListItemAction, styles.overrideMenu)}
              onClick={handleActionButtonClick}
            >
              <Menu
                items={items}
                key={member.userInfo.id}
                sx={{
                  "--menu-color-hover-bg": "var(--theme-brand-color)",
                  "--menu-color-hover-command": "#fff",
                }}
              >
                <MenuButton
                  as="div"
                  style={{
                    width: "24px",
                    height: "24px",
                  }}
                >
                  <VoiceSettingIcon />
                </MenuButton>
              </Menu>
            </Box>
          </IF>
        </Box>
      </Box>
    </>
  );
};

export default MemberListItem;
export { Member, MemberListItem };
