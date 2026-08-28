import * as React from "react";
import styles from "./styles.less";
import BlockSharingIcon from "assets/icon--block-sharing.svg";
import ExpansionBox, { ExpansionRect } from "components/ExpansionBox";
import useStorageInfo from "hooks/useStorageInfo";
import ReactDOM from "react-dom";
import Tooltip from "components/Tooltip";
import Tab from "components/Tab";
import Home from "./components/Home";
import IF from "components/IF";
import hack from "./hack.js";
import BluePrintList from "./components/BluePrintList";
import ArticleList from "./components/ArticleList";
import DemoList from "./components/DemoList";
import toast from "react-hot-toast";
import { Box } from "@gandi-ide/gandi-ui";
import HomeIcon from "./icons/home.svg";
import { buildPluginServiceUrl } from "../../lib/plugin-services";

const DEFAULT_CONTAINER_INFO = {
  width: 300,
  height: 450,
  translateX: 72,
  translateY: 60,
};
const blockSharing: React.FC<PluginContext> = ({
  msg,
  vm,
  workspace,
  blockly,
  utils,
  pluginServices,
  pluginCapabilities,
}) => {
  const contentBaseUrl = pluginServices?.blockSharing?.contentBaseUrl;
  const importAssetBaseUrl = pluginServices?.blockSharing?.importAssetBaseUrl;
  const remoteContentAvailable = pluginCapabilities?.blockSharingRemoteContent ?? Boolean(contentBaseUrl);
  const [visible, setVisible] = React.useState(false);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [loading, setLoading] = React.useState("load");
  const [autoURL, setAutoURL] = React.useState(false);
  const [blockValue, setBlockValue] = React.useState("");
  const [JumpLink, setJumpLink] = React.useState("");

  const [containerInfo, setContainerInfo] = useStorageInfo<ExpansionRect>(
    "TOOLBOX_BLOCKS_SEARCH_CONTAINER_INFO",
    DEFAULT_CONTAINER_INFO,
  );
  const containerInfoRef = React.useRef(containerInfo);
  const handleClick = React.useCallback((e: React.MouseEvent | undefined) => {
    if (e) e.preventDefault();
    setLoading("load");
    setCurrentIndex(0);
    if (e) {
      const rect = (e.target as HTMLDivElement).getBoundingClientRect();
      setContainerInfo({
        ...containerInfoRef.current,
        translateX: rect.x + 28,
        translateY: rect.y - 6,
      });
    } else {
      setContainerInfo({
        ...containerInfoRef.current,
      });
    }
    setVisible(true);
  }, []);

  React.useEffect(() => {
    const menuItemId: string = window.Blockly.ContextMenu.addDynamicMenuItem(
      (items, block) => {
        const saveAsSvg = {
          id: "saveAsSvg",
          enabled: true,
          text: msg("plugins.blockSharing.saveAsSvg"),
          callback: () => {
            hack.exportSVG(block, vm, blockly).then(async (svgData) => {
              const downloadLink = document.createElement("a");
              downloadLink.href = svgData;
              downloadLink.download = "block.svg";
              document.body.appendChild(downloadLink);
              downloadLink.click();
              document.body.removeChild(downloadLink);
            });
          },
        };
        const copyAsSvg = {
          id: "copyAsSvg",
          enabled: true,
          text: msg("plugins.blockSharing.copyAsSvg"),
          callback: async () => {
            try {
              if (navigator.clipboard && window.ClipboardItem) {
                // const base64Data = (await blobToBase64(blockToSVG(block))) as string;
                hack.exportSVG(block, vm, blockly).then(async (svgData) => {
                  const base64Data = svgData;
                  const blob = new Blob([base64Data], { type: "text/plain" });
                  const data = [new ClipboardItem({ [blob.type]: blob })];
                  // 调用Clipboard API的write方法将数据写入剪切板
                  await navigator.clipboard.write(data);
                  toast.success(msg("plugins.blockSharing.copyBlockSuccess"));
                });
              } else {
                toast.error(msg("plugins.blockSharing.browserNotSupport"));
              }
            } catch (err) {
              console.error(err);
              toast.error(msg("plugins.blockSharing.copyError"));
            }
          },
        };
        if (!block.boxed) {
          items.splice(-1, 0, saveAsSvg);
          items.splice(-1, 0, copyAsSvg);
        }
        return items;
      },
      { targetNames: ["blocks", "frame"] },
    );
    return () => {
      if (typeof menuItemId === "string") {
        window.Blockly.ContextMenu.deleteDynamicMenuItem(menuItemId);
      }
    };
  }, []);

  hack.CurrentIndex = currentIndex;
  hack.msg = msg;
  hack.startHack(workspace, blockly, vm, utils, setLoading);

  React.useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const requestedBlock = searchParams.get("Block");
    const requestedAsset = searchParams.get("JumpLink");
    let handledDeepLink = false;

    if (requestedBlock && requestedAsset) {
      if (contentBaseUrl) {
        setBlockValue(requestedBlock);
        setJumpLink(requestedAsset);
        setAutoURL(true);
        handleClick(undefined);
        handledDeepLink = true;
      }
      if (importAssetBaseUrl) {
        hack.postBlocks(
          buildPluginServiceUrl(importAssetBaseUrl, encodeURIComponent(requestedAsset)),
          workspace,
          utils,
          vm,
        );
        handledDeepLink = true;
      }
    }

    if (handledDeepLink) {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.delete("Block");
      currentUrl.searchParams.delete("JumpLink");
      setTimeout(() => {
        window.history.replaceState(null, "", currentUrl.href);
      }, 1000);
    }
    return () => {
      window.postMessage(["dispose"], "*");
    };
  }, [contentBaseUrl, handleClick, importAssetBaseUrl, msg, setAutoURL, utils, vm, workspace]);

  const backToHome = () => {
    if (!contentBaseUrl) return;
    const iframe = document.getElementById("block-sharing-article-iframe") as HTMLIFrameElement | null;
    if (iframe) iframe.src = buildPluginServiceUrl(contentBaseUrl, "tag/blueprint/new", { hideHeader: "" });
    setCurrentIndex(0);
  };

  const homeUrl = contentBaseUrl
    ? autoURL
      ? buildPluginServiceUrl(contentBaseUrl, `article/${encodeURIComponent(blockValue)}`, {
          hideHeader: "",
          JumpLink: JumpLink || undefined,
        })
      : buildPluginServiceUrl(contentBaseUrl, "tag/blueprint/new", { hideHeader: "" })
    : "";

  return (
    <React.Fragment>
      {remoteContentAvailable &&
        ReactDOM.createPortal(
          <Tooltip
            className={styles.icon}
            icon={<BlockSharingIcon />}
            onClick={handleClick}
            tipText={msg("plugins.blockSharing.title")}
          />,
          document.querySelector(".plugins-wrapper"),
        )}
      {visible &&
        remoteContentAvailable &&
        ReactDOM.createPortal(
          <ExpansionBox
            title={msg("plugins.blockSharing.title")}
            id="blockSharing"
            minWidth={300}
            minHeight={450}
            borderRadius={8}
            stayOnTop
            onClose={() => {
              setVisible(false);
              setAutoURL(false);
              setJumpLink("");
            }}
            onSizeChange={() => {
              return;
            }}
            containerInfo={containerInfo}
          >
            <div className={styles.container}>
              {loading === "article" ? (
                <Box className={styles.backButtonIcon}>
                  <Box className={styles.iconBox} onClick={backToHome}>
                    <HomeIcon />
                  </Box>
                  <Tab
                    className={styles.tab}
                    items={[
                      msg("plugins.blockSharing.tag.1"),
                      msg("plugins.blockSharing.tag.2"),
                      msg("plugins.blockSharing.tag.3"),
                      msg("plugins.blockSharing.tag.4"),
                    ]}
                    activeIndex={currentIndex}
                    onChange={setCurrentIndex}
                  />
                </Box>
              ) : loading === "home" ? (
                <Tab
                  className={styles.tab}
                  items={[msg("plugins.blockSharing.tag.5")]}
                  activeIndex={currentIndex}
                  onChange={setCurrentIndex}
                />
              ) : loading === "load" ? (
                <Tab
                  className={styles.tab}
                  items={[msg("plugins.blockSharing.tag.load")]}
                  activeIndex={currentIndex}
                  onChange={setCurrentIndex}
                />
              ) : (
                <></>
              )}
              <IF className={styles.tabWrapper} condition={currentIndex === 0}>
                <Home src={homeUrl} loadBlock={autoURL} />
              </IF>
              <IF className={styles.tabWrapper} condition={currentIndex === 1}>
                <BluePrintList list={hack.bluePrint} msg={msg} />
              </IF>
              <IF className={styles.tabWrapper} condition={currentIndex === 2}>
                <ArticleList list={hack.article} msg={msg} />
              </IF>
              <IF className={styles.tabWrapper} condition={currentIndex === 3}>
                <DemoList list={hack.demo} msg={msg} />
              </IF>
            </div>
          </ExpansionBox>,
          document.body,
        )}
    </React.Fragment>
  );
};

blockSharing.displayName = "blockSharing";

export default blockSharing;
