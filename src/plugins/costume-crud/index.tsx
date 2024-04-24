import * as React from "react";

const CostumeCrud: React.FC<PluginContext> = ({ utils }) => {
  React.useEffect(() => {
    // 更新声音
    utils.expandSoundContextMenuItems([
      {
        key: "crossSourceUpdateSound",
        text: "更新声音",
        handleCallback: (_, soundId) => {
          window.open(
            "https://m.xiguacity.cn/gandi/costume-sound-cu.html",
            "originalSound",
            "height=500, width=700, top=0, left=0, toolbar=no, menubar=no, scrollbars=no, resizable=no, location=no, status=no",
          );
          window.addEventListener(
            "message",
            (event) => {
              if (event.data && event.data.name === "plugin-sound-data") {
                const { buffer } = event.data;
                utils.updateSoundBufferByTargetId({
                  soundId,
                  soundEncoding: new Uint8Array(buffer.slice(0)),
                });
              }
            },
            false,
          );
        },
      },
    ]);
    // 新增声音
    utils.expandSoundMenuItems([
      {
        id: "crossSourceAddSound",
        img: "https://img2.imgtp.com/2024/04/23/PWpy1Ld5.svg",
        title: "新增声音",
        onClick: () => {
          window.open(
            "https://m.xiguacity.cn/gandi/costume-sound-cu.html",
            "originalSound",
            "height=500, width=700, top=0, left=0, toolbar=no, menubar=no, scrollbars=no, resizable=no, location=no, status=no",
          );
          window.addEventListener(
            "message",
            (event) => {
              if (event.data && event.data.name === "plugin-sound-data") {
                const { buffer, fileType, fileName } = event.data;
                utils.addSoundToTarget(buffer, fileName, fileType);
              }
            },
            false,
          );
        },
      },
    ]);
    // 更新造型
    utils.expandCostumeContextMenuItems([
      {
        key: "crossSourceUpdateCostume",
        text: "更新造型",
        handleCallback: (_, costumeId) => {
          window.open(
            "https://m.xiguacity.cn/gandi/costume-sound-cu.html",
            "originalCostume",
            "height=500, width=700, top=0, left=0, toolbar=no, menubar=no, scrollbars=no, resizable=no, location=no, status=no",
          );
          window.addEventListener(
            "message",
            (event) => {
              if (event.data && event.data.name === "plugin-costume-data") {
                const { data, fileType, width, height } = event.data;
                const rotationCenterX = Math.floor(width / 2);
                const rotationCenterY = Math.floor(height / 2);
                utils.updateCostumeByTargetId({
                  costumeId,
                  isVector: fileType === "image/svg+xml",
                  bitmap: data as ArrayBuffer,
                  rotationCenterX,
                  rotationCenterY,
                  width,
                  height,
                });
              }
            },
            false,
          );
        },
      },
    ]);
    // 新增造型
    utils.expandCostumeMenuItems([
      {
        id: "crossSourceAddCostume",
        img: "https://img2.imgtp.com/2024/04/23/PWpy1Ld5.svg",
        title: "新增造型",
        onClick: () => {
          window.open(
            "https://m.xiguacity.cn/gandi/costume-sound-cu.html",
            "originalCostume",
            "height=500, width=700, top=0, left=0, toolbar=no, menubar=no, scrollbars=no, resizable=no, location=no, status=no",
          );
          window.addEventListener(
            "message",
            (event) => {
              if (event.data && event.data.name === "plugin-costume-data") {
                const { data, fileType, fileName } = event.data;
                utils.addCostumeToTarget(data, fileName, fileType);
              }
            },
            false,
          );
        },
      },
    ]);
    return () => {
      utils.removeSoundContextMenuItems(["crossSourceUpdateSound"]);
      utils.removeSoundMenuItems(["crossSourceAddSound"]);
      utils.removeCostumeContextMenuItems(["crossSourceUpdateCostume"]);
      utils.removeCostumeMenuItems(["crossSourceAddCostume"]);
    };
  }, []);

  return null;
};

CostumeCrud.displayName = "CostumeCrud";

export default CostumeCrud;
