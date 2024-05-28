import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  BasicStorage,
  ChatMessage,
  ChatProvider,
  Conversation,
  ConversationId,
  ConversationRole,
  IStorage,
  MessageContentType,
  Participant,
  Presence,
  TypingUsersList,
  UpdateState,
  User,
  UserStatus,
} from "@chatscope/use-chat";
import { ExampleChatService } from "@chatscope/use-chat/dist/examples";
import { Chat } from "./Chat";
import { nanoid } from "nanoid";
import { AutoDraft } from "@chatscope/use-chat/dist/enums/AutoDraft";
import React from "react";
import { IntlShape } from "react-intl";
import { defineMessage } from "@formatjs/intl";
import { Contact, Type } from "../componet/Contact";
const hostname: string = window.location.hostname;
let assetHost = "https://m.ccw.site";
let apiHost = "https://gandi-main.ccw.site";
if (!hostname.endsWith("ccw.site")) {
  assetHost = "https://d3sh2pl0ajjotb.cloudfront.net";
  apiHost = "https://gandi-main.cocrea.world";
}
const messages = defineMessage({
  guestName: {
    id: "plugins.inspiro.guest.name",
    defaultMessage: "我",
  },
  audioGeneratorName: {
    id: "plugins.inspiro.audio.name",
    defaultMessage: "音乐魔法师",
  },
  audioGeneratorDesc: {
    id: "plugins.inspiro.audio.desc",
    defaultMessage: "在👇描述您的想法,我会根据该想法谱出一曲天籁🎵",
  },
  imageGeneratorName: {
    id: "plugins.inspiro.image.name",
    defaultMessage: "妙笔生花",
  },
  imageGeneratorDesc: {
    id: "plugins.inspiro.image.desc",
    defaultMessage: "在👇描述您的想法,我会将该想法绘成精美的画🎨",
  },
});

const messageIdGenerator = (message: ChatMessage<MessageContentType>) => nanoid();
const groupIdGenerator = () => nanoid();
const message_generator = async (path: string, body: any, idKey: string) => {
  return await fetch(path, {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => response.json())
    .then((response) => {
      const body = response["body"];
      if (!body || !(idKey in body)) {
        return undefined;
      }
      return response["body"][idKey];
    });
};

function createConversation(id: ConversationId, name: string): Conversation {
  return new Conversation({
    id,
    participants: [
      new Participant({
        id: name,
        role: new ConversationRole([]),
      }),
    ],
    unreadCounter: 0,
    typingUsers: new TypingUsersList({ items: [] }),
    draft: "",
  });
}

let guestStorage = new BasicStorage({ groupIdGenerator, messageIdGenerator });
// Create serviceFactory
const serviceFactory = (storage: IStorage, updateState: UpdateState) => {
  return new ExampleChatService(storage, updateState);
};
let previewMe = null;
function Entrance({ utils, intl }: { utils: any; intl: IntlShape }) {
  const guest = {
    name: intl.formatMessage(messages.guestName),
    avatar: "",
  };
  const audio = {
    name: intl.formatMessage(messages.audioGeneratorName),
    type: Type.MUSIC,
    desc: intl.formatMessage(messages.audioGeneratorDesc),
    duration: 15,
    avatar: `${assetHost}/tmp/inspairo-audio-avatar.png`,
    generator: async (text: string): Promise<string> => {
      return message_generator(`${apiHost}/ai/hub/txt2music`, { prompt: text }, "id");
    },
  };
  const image = {
    name: intl.formatMessage(messages.imageGeneratorName),
    type: Type.IMAGE,
    desc: intl.formatMessage(messages.imageGeneratorDesc),
    duration: 1,
    avatar: `${assetHost}/tmp/inspairo-image-avatar.png`,
    generator: async (text: string): Promise<string> => {
      return message_generator(`${apiHost}/ai/hub/txt2img`, { text: text }, "taskId");
    },
  };
  if (previewMe != null && previewMe != guest.name) {
    guestStorage = new BasicStorage({ groupIdGenerator, messageIdGenerator });
  }
  previewMe = guest.name;
  const chats = [{ name: guest.name, storage: guestStorage }];
  const users: Array<Contact> = [guest, audio, image];
  const contacts = new Map(users.map((item) => [item.name, item]));
  // Add users and conversations to the states
  chats.forEach((c) => {
    users.forEach((u) => {
      if (u.name !== c.name) {
        c.storage.addUser(
          new User({
            id: u.name,
            presence: new Presence({ status: UserStatus.Available, description: "" }),
            firstName: "",
            lastName: "",
            username: u.name,
            email: "",
            avatar: u.avatar,
          }),
        );

        const conversationId = nanoid();

        const myConversation = c.storage
          .getState()
          .conversations.find((cv) => typeof cv.participants.find((p) => p.id === u.name) !== "undefined");
        c.storage.setActiveConversation(conversationId);
        if (!myConversation) {
          c.storage.addConversation(createConversation(conversationId, u.name));
          const chat = chats.find((chat) => chat.name === u.name);

          if (chat) {
            const hisConversation = chat.storage
              .getState()
              .conversations.find((cv) => typeof cv.participants.find((p) => p.id === c.name) !== "undefined");
            if (!hisConversation) {
              chat.storage.addConversation(createConversation(conversationId, c.name));
            }
          }
        }
      }
    });
  });
  return (
    <ChatProvider
      serviceFactory={serviceFactory}
      storage={guestStorage}
      config={{
        typingThrottleTime: 250,
        typingDebounceTime: 900,
        debounceTyping: true,
        autoDraft: AutoDraft.Save | AutoDraft.Restore,
      }}
    >
      <Chat
        intl={intl}
        user={{
          id: guest.name,
          presence: new Presence({ status: UserStatus.Available, description: "" }),
          firstName: "",
          lastName: "",
          username: guest.name,
          email: "",
          avatar: guest.avatar,
          bio: "",
        }}
        utils={utils}
        contacts={contacts}
        ext={{
          ai_domain: apiHost,
        }}
      />
    </ChatProvider>
  );
}

export default Entrance;
