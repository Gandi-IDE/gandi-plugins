import * as React from "react";
import ReactDOM from "react-dom";
import styles from "./styles.less";
import Tooltip from "components/Tooltip";

import ExtensionManagerIcon from "assets/icon--extension-manager.svg";
import TrashcanIcon from "assets/icon--trashcan.svg";
import MultiselectBoxIcon from "assets/icon--multiselect-box.svg";

import ExpansionBox, { ExpansionRect } from "components/ExpansionBox";

import { defineMessage } from "@formatjs/intl";
import useStorageInfo from "hooks/useStorageInfo";

const messages = defineMessage({
  title: {
    id: "plugins.ExtensionManager.title",
    defaultMessage: "Extension Manager",
  },
  intro: {
    id: "plugins.ExtensionManager.intro",
    defaultMessage: "Manage your extensions",
  },
});

const DEFAULT_CONTAINER_INFO = {
  width: 300,
  height: 450,
  translateX: 72,
  translateY: 60,
};

const ExtensionManager: React.FC<PluginContext> = ({ intl, utils, vm }) => {
  const [visible, setVisible] = React.useState(false);
  const [loadedExtensions, setLoadedExtensions] = React.useState([]);
  const [selectedExtensions, setSelectedExtensions] = React.useState({});

  //Container stuff vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv
  const containerRef = React.useRef(null);
  const [containerInfo, setContainerInfo] = useStorageInfo<ExpansionRect>(
    "EXTENSION_MANAGER_CONTAINER_INFO",
    DEFAULT_CONTAINER_INFO,
  );

  const containerInfoRef = React.useRef(containerInfo);
  const getContainerPosition = React.useCallback(() => {
    const { x, y } = containerRef.current.getBoundingClientRect();
    return {
      translateX: x - containerInfoRef.current.width - 10,
      translateY: y - 6,
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
    setSelectedExtensions({});
    setVisible(false);
  };

  const handleSizeChange = React.useCallback((value: ExpansionRect) => {
    containerInfoRef.current = value;
  }, []);
  //Container stuff ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  //Extension list stuff vvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvvv

  const getExtensionNameById = (id: string) => {
    const infos = utils.getAllExtensionInfo();

    for (const i in infos) {
      if (infos[i].extensionId === id) return infos[i].name;
    }
  };

  const handleDelete = React.useCallback(
    (key: string) => {
      try {
        if (selectedExtensions[key]) {
          for (const i in selectedExtensions) {
            delete selectedExtensions[i];
            vm.extensionManager.deleteExtensionById(i);
          }
        } else {
          vm.extensionManager.deleteExtensionById(key);
        }
      } catch {
        document.body.classList.add(styles.shakeAnimation);
        setTimeout(() => {
          document.body.classList.remove(styles.shakeAnimation);
        }, 1000);
      }

      getLoadedExtensions();
      console.log(selectedExtensions);
    },
    [selectedExtensions],
  );

  const handleMultiselect = (key) => {
    setSelectedExtensions((prevState) => ({
      ...prevState,
      [key]: !prevState[key],
    }));
    const parent = document.querySelector(`.extensionManager-item-${key}`);
    if (parent.classList.contains(styles.lift)) {
      parent.classList.remove(styles.lift);
    } else {
      parent.classList.add(styles.lift);
    }
  };

  const getLoadedExtensions = () => {
    const extensions = Array.from(vm.extensionManager._loadedExtensions as Map<string, string>).map(([key, value]) => (
      <div className={[styles.extensionManagerItem, `extensionManager-item-${key}`].join(" ")} key={key}>
        <button
          className={
            selectedExtensions[key] ? styles.extensionManagerItemSelected : styles.extensionManagerItemNotSelected
          }
          onClick={() => handleMultiselect(key)}
        >
          <MultiselectBoxIcon />
        </button>
        <span className={styles.extensionManagerItemInfo}>{getExtensionNameById(key)}</span>
        <button className={styles.extensionManagerItemDelete} onClick={() => handleDelete(key)}>
          <TrashcanIcon />
        </button>
      </div>
    ));
    setLoadedExtensions(extensions);
  };

  //Extension list stuff ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

  React.useEffect(() => {
    if (visible) {
      getLoadedExtensions();
    }
    console.log(selectedExtensions);
  }, [visible, selectedExtensions]);

  return ReactDOM.createPortal(
    <section className={"extensionManager"} ref={containerRef}>
      <Tooltip
        className={styles.extensionManagerTooltip}
        icon={<ExtensionManagerIcon />}
        onClick={handleShow}
        tipText={intl.formatMessage(messages.title)}
      />
      {visible &&
        ReactDOM.createPortal(
          <ExpansionBox
            id="extensionManager"
            title={intl.formatMessage(messages.title)}
            containerInfo={containerInfo}
            onClose={handleClose}
            onSizeChange={handleSizeChange}
            minWidth={0}
            minHeight={0}
            borderRadius={0}
          >
            <div className={styles.extensionManagerItemContainer}>{loadedExtensions}</div>
          </ExpansionBox>,
          document.body,
        )}
    </section>,
    document.querySelector(".plugins-wrapper"),
  );
};

ExtensionManager.displayName = "Extension Manager";

export default ExtensionManager;
