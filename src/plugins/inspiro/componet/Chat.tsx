import { useMemo, useCallback, useEffect, ReactNode } from "react";

import {
  MainContainer,
  Sidebar,
  ConversationList,
  Conversation,
  ChatContainer,
  ConversationHeader,
  MessageGroup,
  Message,
  MessageList,
  MessageInput,
  TypingIndicator,
  MessageModel,
  Button,
  Avatar,
} from "@chatscope/chat-ui-kit-react";

import {
  useChat,
  ChatMessage,
  MessageContentType,
  MessageDirection,
  MessageStatus,
  VideoContent,
  HtmlContent,
} from "@chatscope/use-chat";
import { MessageContent, TextContent, User } from "@chatscope/use-chat";
import React from "react";
import { Contact, Type } from "./Contact";
import ImportIcon from "assets/icon--inspiro-import.svg";
import { nanoid } from "nanoid";
import styles from "../styles.less";
import toast from "react-hot-toast";
import { IntlShape } from "react-intl";
import { defineMessage } from "@formatjs/intl";

const messages = defineMessage({
  generateFail: {
    id: "plugins.inspiro.generate.fail",
    defaultMessage: "生成素材失败",
  },
  importFail: {
    id: "plugins.inspiro.import.fail",
    defaultMessage: "导入失败",
  },
  importSuccess: {
    id: "plugins.inspiro.import.success",
    defaultMessage: "导入成功",
  },
  inputPlaceholder: {
    id: "plugins.inspiro.input.placeholder",
    defaultMessage: "在这里输入您的想法",
  },
  importButtonDesc: {
    id: "plugins.inspiro.import.desc",
    defaultMessage: "导入到当前角色",
  },
  typingInfo: {
    id: "plugins.inspiro.typing.info",
    defaultMessage: "生成中",
  },
});

const MAX_POLLS = 10; // 最大轮询次数

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

function createCounter() {
  const countMap = Object.keys(Type).reduce(
    (acc: Record<Type, number>, key: string) => {
      acc[Type[key]] = 0;
      return acc;
    },
    {} as Record<Type, number>,
  );

  // 闭包函数，用于每次增加计数
  function increaseCount(type: Type) {
    const count = (countMap[type] += 1);
    countMap[type] = count;
    return count;
  }

  // 闭包函数，用于每次减少计数
  function decreaseCount(type: Type) {
    const count = (countMap[type] -= 1);
    if (count < 0) {
      return 0;
    }
    countMap[type] = count;
    return count;
  }

  // 返回一个对象，公开 `getCount`、`increaseCount` 和 `decreaseCount` 方法
  return {
    getCount: (type: Type) => countMap[type],
    increaseCount,
    decreaseCount,
  };
}
const counter = createCounter();
export const Chat = ({
  intl,
  user,
  utils,
  contacts,
  ext,
}: {
  intl: IntlShape;
  user: User;
  utils: any;
  contacts: Map<string, Contact>;
  ext: any;
}) => {
  const {
    currentMessages,
    conversations,
    activeConversation,
    setActiveConversation,
    sendMessage,
    getUser,
    currentMessage,
    setCurrentMessage,
    sendTyping,
    setCurrentUser,
  } = useChat();

  useEffect(() => {
    setCurrentUser(user);
  }, [user, setCurrentUser]);

  // Get current user data
  const [currentUserAvatar, currentUserName, currentUserInfo] = useMemo(() => {
    if (activeConversation) {
      const participant = activeConversation.participants.length > 0 ? activeConversation.participants[0] : undefined;
      if (participant) {
        const user = getUser(participant.id);
        if (user) {
          return [<Avatar src={user.avatar} key={user.id} />, user.username, contacts.get(participant.id).desc];
        }
      }
    }

    return [undefined, undefined];
  }, [activeConversation, getUser]);

  const handleChange = (value: string) => {
    setCurrentMessage(value);
    if (activeConversation) {
      sendTyping({
        conversationId: activeConversation?.id,
        isTyping: true,
        userId: user.id,
        content: value,
        throttle: true,
      });
    }
  };
  const addTypingUser = (id: string, type: Type) => {
    activeConversation.addTypingUser({ userId: id, content: "", isTyping: true });
    counter.increaseCount(type);
  };
  const removeTypingUser = (id: string, type: Type) => {
    counter.decreaseCount(type);
    if (counter.getCount(type) > 0) {
      return;
    }
    activeConversation.removeTypingUser(id);
  };
  const handleCallbackByReceiver = (response: JSON, receiver: Contact): ChatMessage<any>[] => {
    const messages: ChatMessage<any>[] = [];
    for (const asset of response["body"]["assets"]) {
      const message = new ChatMessage({
        id: "",
        content: asset as unknown as MessageContent<unknown>,
        contentType: MessageContentType.Image,
        senderId: receiver.name,
        direction: MessageDirection.Incoming,
        status: MessageStatus.Sent,
      });
      if (receiver.type === Type.MUSIC) {
        const content = { url: asset } as VideoContent;
        message.content = content;
        message.contentType = MessageContentType.Video;
      }
      messages.push(message);
    }
    return messages;
  };
  const pollForResult = (id: string, receiver: Contact) => {
    let pollCount = 0; // 初始化轮询计数器
    const intervalId = setInterval(async () => {
      try {
        if (id === undefined || id === null) {
          throw new Error();
        }
        const response = await fetch(`${ext["ai_domain"]}/ai/hub/task/${id}?type=${receiver.type}`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }).then((response) => response.json());
        if (response["code"] === "200" && response["body"]["status"] === "finished") {
          clearInterval(intervalId);
          removeTypingUser(receiver.name, receiver.type);
          const messages = handleCallbackByReceiver(response, receiver);
          for (const message of messages) {
            await sleep(500);
            sendMessage({
              message,
              conversationId: activeConversation.id,
              senderId: receiver.name,
            });
          }
        } else {
          pollCount++;
          if (pollCount >= MAX_POLLS) {
            clearInterval(intervalId);
          }
        }
      } catch (error) {
        removeTypingUser(receiver.name, receiver.type);
        sendMessage({
          message: new ChatMessage({
            id: "",
            content: intl.formatMessage(messages.generateFail) as unknown as HtmlContent,
            contentType: MessageContentType.TextPlain,
            senderId: receiver.name,
            direction: MessageDirection.Incoming,
            status: MessageStatus.Sent,
          }),
          conversationId: activeConversation.id,
          senderId: receiver.name,
        });
        clearInterval(intervalId);
      }
    }, receiver.duration * 1000);
  };
  const handleSend = (text: string) => {
    const message = new ChatMessage({
      id: "", // Id will be generated by storage generator, so here you can pass an empty string
      content: text as unknown as MessageContent<TextContent>,
      contentType: MessageContentType.TextHtml,
      senderId: user.id,
      direction: MessageDirection.Outgoing,
      status: MessageStatus.Sent,
    });

    if (activeConversation) {
      sendMessage({
        message,
        conversationId: activeConversation.id,
        senderId: user.id,
      });
      const receiverName = activeConversation.participants[0].id;
      const receiver = contacts.get(receiverName);
      addTypingUser(receiverName, receiver.type);
      receiver.generator(text).then((id: string) => pollForResult(id, receiver));
    }
  };

  const chatMessage2Message = (chatMessage: ChatMessage<MessageContentType>): ReactNode => {
    const message: MessageModel = {
      type: "text",
      direction: chatMessage.direction,
      position: "normal",
      sentTime: chatMessage.createdTime.toUTCString(),
      sender: chatMessage.senderId,
    };
    switch (chatMessage.contentType) {
      case MessageContentType.TextHtml:
        message.type = "html";
        message.payload = chatMessage.content;
        break;
      case MessageContentType.Video:
        message.type = "custom";
        message.payload = (
          <Message.CustomContent>
            <div>
              <audio controls={true} src={chatMessage.content["url"]}></audio>
            </div>
          </Message.CustomContent>
        );
        break;
      case MessageContentType.Image:
        message.type = "image";
        message.payload = {
          src: chatMessage.content,
          width: 300,
          height: 300,
        };
        break;
      default:
        message.payload = chatMessage.content;
    }
    return (
      <div style={{ display: "flex", alignItems: "center" }} key={chatMessage.id}>
        <Message key={chatMessage.id} model={message} />
        {message.sender !== user.id && message.type != "text" && (
          <Button
            className={styles.scalingButton}
            border
            icon={<ImportIcon />}
            title={intl.formatMessage(messages.importButtonDesc)}
            onClick={async () => {
              let asset = chatMessage.content;
              if (message.type !== "image") {
                asset = asset["url"];
              }
              const response = await fetch(asset as any);
              if (!response.ok) {
                toast.error(intl.formatMessage(messages.importFail));
                return;
              }
              const blob = await response.blob();
              const buffer = await blob.arrayBuffer();
              const fileName = nanoid();
              if (message.type === "image") {
                utils.addCostumeToTarget(buffer, fileName, "image/png");
              } else {
                utils.addSoundToTarget(buffer, fileName, "audio/wav");
              }
              toast.success(intl.formatMessage(messages.importSuccess));
            }}
          ></Button>
        )}
      </div>
    );
  };

  const getTypingIndicator = useCallback(() => {
    if (activeConversation) {
      const typingUsers = activeConversation.typingUsers;

      if (typingUsers.length > 0) {
        const typingUserId = typingUsers.items[0].userId;

        if (activeConversation.participantExists(typingUserId)) {
          const typingUser = getUser(typingUserId);

          if (typingUser) {
            return <TypingIndicator content={intl.formatMessage(messages.typingInfo)} />;
          }
        }
      }
    }

    return undefined;
  }, [activeConversation, getUser]);

  return (
    <MainContainer responsive style={{ backgroundColor: "#191e25" }}>
      <Sidebar position="left" scrollable>
        <ConversationList>
          {conversations.map((c) => {
            // Helper for getting the data of the first participant
            const [avatar, name] = (() => {
              const participant = c.participants.length > 0 ? c.participants[0] : undefined;

              if (participant) {
                const user = getUser(participant.id);
                if (user) {
                  return [<Avatar src={user.avatar} key={user.id} />, user.username];
                }
              }

              return [undefined, undefined];
            })();

            return (
              <Conversation
                key={c.id}
                name={name}
                info={c.draft ? `Draft: ${c.draft.replace(/<br>/g, "\n").replace(/&nbsp;/g, " ")}` : ``}
                active={activeConversation?.id === c.id}
                unreadCnt={c.unreadCounter}
                onClick={() => setActiveConversation(c.id)}
              >
                {avatar}
              </Conversation>
            );
          })}
        </ConversationList>
      </Sidebar>

      <ChatContainer>
        {activeConversation && (
          <ConversationHeader>
            {currentUserAvatar}
            <ConversationHeader.Content userName={currentUserName} info={currentUserInfo} />
          </ConversationHeader>
        )}
        <MessageList typingIndicator={getTypingIndicator()}>
          {activeConversation &&
            currentMessages.map((g) => (
              <MessageGroup key={g.id} direction={g.direction}>
                <MessageGroup.Messages>
                  {g.messages.map((m: ChatMessage<MessageContentType>) => chatMessage2Message(m))}
                </MessageGroup.Messages>
              </MessageGroup>
            ))}
        </MessageList>
        <MessageInput
          value={currentMessage}
          onChange={handleChange}
          onSend={handleSend}
          disabled={!activeConversation}
          attachButton={false}
          placeholder={intl.formatMessage(messages.inputPlaceholder)}
        />
      </ChatContainer>
    </MainContainer>
  );
};
