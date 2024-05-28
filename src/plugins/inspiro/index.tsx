import * as React from "react";
import styles from "./styles.less";
import ReactDOM from "react-dom";
import { defineMessage } from "@formatjs/intl";
import Tooltip from "components/Tooltip";
import InspiroIcon from "assets/icon--inspiro.svg";
import ExpansionBox, { ExpansionRect } from "components/ExpansionBox";
import Entrance from "./componet/Entrance";
import useStorageInfo from "hooks/useStorageInfo";

const messages = defineMessage({
  title: {
    id: "plugins.inspiro.title",
    defaultMessage: "AI 助手",
  },
  intro: {
    id: "plugins.inspiro.intro",
    defaultMessage:
      "您在 Gandi IDE 中的全能 AI 助手！无论您是想生成令人惊叹的图片、创作动听的音乐，还是需要灵感来实现您的创意梦想，创灵助手都能为您提供无尽的可能性。",
  },
});

const DEFAULT_CONTAINER_INFO = {
  width: 724,
  height: 600,
  translateX: 0,
  translateY: 0,
};

const Inspiro: React.FC<PluginContext> = ({ intl, utils, vm, registerSettings, trackEvents }) => {
  const [visible, setVisible] = React.useState(false);
  const containerRef = React.useRef(null);
  const [containerInfo, setContainerInfo] = useStorageInfo<ExpansionRect>(
    "DEFAULT_CHAT_CONTAINER_INFO",
    DEFAULT_CONTAINER_INFO,
  );
  const containerInfoRef = React.useRef(containerInfo);
  const getContainerPosition = React.useCallback(() => {
    const { x, y } = containerRef.current.getBoundingClientRect();
    return {
      translateX: x - containerInfoRef.current.width,
      translateY: y - 40,
    };
  }, []);
  const handleShow = React.useCallback(() => {
    setContainerInfo({
      ...containerInfoRef.current,
      ...getContainerPosition(),
    });
    setVisible(true);
  }, []);

  const handleClose = () => {
    setVisible(false);
  };
  const handleSizeChange = React.useCallback((value: ExpansionRect) => {
    containerInfoRef.current = value;
  }, []);
  return ReactDOM.createPortal(
    <section className={styles.inspiroRoot} ref={containerRef}>
      <Tooltip
        className={styles.icon}
        icon={<InspiroIcon />}
        onClick={handleShow}
        tipText={intl.formatMessage(messages.title)}
      />
      {visible &&
        ReactDOM.createPortal(
          <ExpansionBox
            id="inspiro"
            title={intl.formatMessage(messages.title)}
            containerInfo={containerInfo}
            onClose={handleClose}
            onSizeChange={handleSizeChange}
            minWidth={0}
            minHeight={0}
            borderRadius={0}
          >
            <Entrance utils={utils} intl={intl}></Entrance>
          </ExpansionBox>,
          document.body,
        )}
    </section>,
    document.querySelector(".plugins-wrapper"),
  );
};

Inspiro.displayName = "Inspiro";

export default Inspiro;
