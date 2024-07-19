import * as React from "react";
import ExpansionBox, { ExpansionRect } from "components/ExpansionBox";
import { Box, Button, Grid, GridItem } from "gandi-ui";
import style from "./VoiceDialog.less";
import { MemberListItem, Member } from "./MemberList/MemberListItem";
interface VoiceDialogProps {
  containerInfo: ExpansionRect;
  onClose: () => void;
  onSizeChange: (rect: ExpansionRect) => void;
  msg: (id: string) => string;
  onConnectClick: () => Promise<void>;
  isLoading: boolean;
  isConnected: boolean;
  member: Array<Member>;
}
const VoiceDialog: React.FC<VoiceDialogProps> = ({
  containerInfo,
  onClose,
  onSizeChange,
  msg,
  onConnectClick,
  isLoading,
  isConnected,
  member,
}) => {
  /* mock */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const memberMock: Array<Member> = [
    {
      userId: "60c30dc80f27e42a48ebdc1f",
      clientId: "kkddedekkkk",
      userInfo: {
        id: "1",
        name: "张三",
        avatar:
          "https://m.ccw.site/avatar/619b9141e0c34311283fd4d8/27b2a870-5bc2-4e29-a046-23389b1eb042.png?x-oss-process=image%2Fresize%2Cs_150%2Fformat%2Cwebp",
        authority: "MEMBER",
        role: "前端工程师",
        online: true,
        color: "#FF0000",
      },
      isMuted: false,
      isSpeaking: true,
      isLocal: false,
      isMutedByAdmin: false,
    },
  ];

  return (
    <ExpansionBox
      id="voice-dialog"
      title={msg("plugins.voiceCooperation.title")}
      minWidth={300}
      minHeight={450}
      borderRadius={6}
      onClose={onClose}
      onSizeChange={onSizeChange}
      containerInfo={containerInfo}
    >
      <div className={style.dialog}>
        <Grid templateColumns="repeat(5, 1fr)" gap={6} className={style.grid}>
          <GridItem colSpan={2}>
            <Button
              colorScheme={isConnected ? "red" : "green"}
              size="lg"
              width="100%"
              borderRadius="md"
              className={style.joinButton}
              onClick={onConnectClick}
              isLoading={isLoading}
            >
              {isConnected ? msg("plugins.voiceCooperation.leave") : msg("plugins.voiceCooperation.join")}
            </Button>
          </GridItem>
        </Grid>
        <Grid>
          <GridItem colSpan={1}>
            <Box className={style.memberList}>
              <Box as="ul" className={style.memberListContent}>
                {member.map((item, index) => (
                  <MemberListItem key={index} {...item} />
                ))}
              </Box>
            </Box>
          </GridItem>
        </Grid>
      </div>
    </ExpansionBox>
  );
};

export default VoiceDialog;
