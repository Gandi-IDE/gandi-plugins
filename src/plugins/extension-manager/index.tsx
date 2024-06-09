import * as React from "react";
import ReactDOM from "react-dom";
import styles from "./styles.less";
import Tooltip from "components/Tooltip";

import ExtensionManagerIcon from "assets/icon--extension-manager.svg";
import TrashcanIcon from "assets/icon--trashcan.svg";
import ExpansionBox, { ExpansionRect } from "components/ExpansionBox";
import DraggableIcon from "assets/icon--draggable.svg";

import { defineMessage } from "@formatjs/intl";
import useStorageInfo from "hooks/useStorageInfo";

const messages = defineMessage({
  title: {
    id: "plugins.ExtensionManager.title",
    defaultMessage: "Extension Manager",
  },
  intro: {
    id: "plugins.ExtensionManager.intro",
    defaultMessage:
      "Manage your extensions",
  },
});

const DEFAULT_CONTAINER_INFO = {
  width: 300,
  height: 450,
  translateX: 72,
  translateY: 60,
};

interface ExtensionManager {
  _loadedExtensions: Map<string, string>;
  deleteExtensionById: (id: string) => void;
}

interface VirtualMachineWithExtensions extends VirtualMachine {
  extensionManager: ExtensionManager;
}

const ExtensionManager: React.FC<PluginContext & { vm: VirtualMachineWithExtensions }> = ({ intl, utils, vm, redux }) => {
  //console.log(vm)
  //console.log(redux)

  const locale = (redux.state.locales as any).locale

  //patch the built-in getExtensionInfoByID
  const getExtensionInfoById = (id: string) => {
    let info = (vm as any).extensionManager.getExtensionInfoById(id);

    if (!info) {
      info = {info: {extensionId: id, name: id}}
    }

    //check if its the full extension info
    if (!info.hasOwnProperty("name")) {
      info.info.name = id
    };

    return info
  }

  const getExtensionNameByPatchedInfo = (info) => {
    let name;
    if (info.l10n) {
      name = Object.values(info.l10n[locale])[0]
    }
    if (!name) {
      name = info.info.name
    }

    return name as any
  }

  //Container stuff-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  const [visible, setVisible] = React.useState(false);
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
    setVisible(false);
  };

  const handleSizeChange = React.useCallback((value: ExpansionRect) => {
    containerInfoRef.current = value;
  }, []);
  //Container stuff-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  const [loadedExtensions, setLoadedExtensions] = React.useState([]);

  const handleDelete = React.useCallback((key: string) => {
    try {
      vm.extensionManager.deleteExtensionById(key);
    }
    catch {
      // Apply the shake animation to the body
      document.body.classList.add(styles.shakeAnimation);
      // Remove the animation after it completes
      setTimeout(() => {
        document.body.classList.remove(styles.shakeAnimation);
      }, 1000);
    }
    
    getLoadedExtensions();
  }, [])

  const handleDragStart = (event, key) => {
    event.dataTransfer.setData('text/plain', key);
  };
  
  const handleDragEnter = (event, key) => {
    const dropTarget = event.target.closest(`.${styles.extensionManagerItem}`);
    dropTarget.classList.add(styles.extensionManagerItemClosest);
  };
  
  const handleDragLeave = (event, key) => {
    const dropTarget = event.target.closest(`.${styles.extensionManagerItem}`);
    dropTarget.classList.remove(styles.extensionManagerItemClosest);
  };

  const handleDrop = (event, key) => {
    event.preventDefault();
    const draggedId = event.dataTransfer.getData('text');
    const draggedElement = document.getElementById(draggedId);
    const dropTarget = event.target.closest(`.${styles.extensionManagerItem}`);
  
    // Determine the position of the mouse relative to the drop target
    const rect = dropTarget.getBoundingClientRect();
    const offset = (event.clientY - rect.top) / (rect.bottom - rect.top);
  
    // If the mouse is in the top half of the drop target, insert the dragged element before the drop target.
    // Otherwise, insert it after.
    if (offset < 0.5) {
      dropTarget.parentNode.insertBefore(draggedElement, dropTarget);
    } else {
      if (dropTarget.nextSibling) {
        dropTarget.parentNode.insertBefore(draggedElement, dropTarget.nextSibling);
      } else {
        dropTarget.parentNode.appendChild(draggedElement);
      }
    }
  };  
  
  const getLoadedExtensions = () => {
    const extensions = Array.from(vm.extensionManager._loadedExtensions as Map<string, string>).map(([key, value]) => (
      <div 
        className={styles.extensionManagerItem} 
        key={key}
        //draggable
        //onDragStart={(event) => handleDragStart(event, key)}
        //onDragEnter={(event) => handleDragEnter(event, key)}
        //onDragLeave={(event) => handleDragLeave(event, key)}
        //onDrop={(event) => handleDrop(event, key)}
        //onDragOver={(event) => event.preventDefault()}
      >
        {/* <div className={styles.extensionManagerItemDrag}><DraggableIcon /></div> */}
        <span className={styles.extensionManagerItemInfo}>{ getExtensionNameByPatchedInfo(getExtensionInfoById(key)) }</span>
        <button className={styles.extensionManagerItemDelete} onClick={ () => handleDelete(key) }><TrashcanIcon /></button>
      </div>
    ));
    setLoadedExtensions(extensions);
  };
  

  React.useEffect(() => {
    if (visible) {
      getLoadedExtensions();
    }
  }, [visible]);

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

ExtensionManager.displayName = "ExtensionManager";

export default ExtensionManager;
