import * as React from "react";

const CostumePiskel: React.FC<PluginContext> = ({ utils, vm, msg }) => {
  React.useEffect(() => {
    const targetWindowMap = new Map<string, MessageEventSource>();
    const pendingTargetCostumes = new Map<string, string[]>();
    let syncTimer: NodeJS.Timeout;

    // https://github.com/Gandi-IDE/piskel
    const piskelHost = "https://ai-static.ccw.site/test/piskel-1e80317/index.html";

    const handleCostumeMessage = (event: MessageEvent) => {
      if (event.data && event.data.name === "plugin-piskel-update") {
        const { data, fileType, width, height, costumeId } = event.data;
        const rotationCenterX = Math.floor(width / 2);
        const rotationCenterY = Math.floor(height / 2);
        utils.updateCostumeByTargetId({
          costumeId,
          isVector: fileType === "image/svg+xml",
          bitmap: data,
          rotationCenterX,
          rotationCenterY,
          width,
          height,
        });
      } else if (event.data && event.data.name === "plugin-piskel-add") {
        const { data, fileName, fileType, targetId, tempCostumeId } = event.data;
        utils.addCostumeToTarget(data, fileName, fileType, targetId).then((costumes) => {
          costumes.forEach((costume) => {
            targetWindowMap[targetId].postMessage(
              {
                name: "plugin-piskel-sync",
                data: {
                  tempCostumeId,
                  costumeId: costume.id,
                  name: costume.name,
                },
              },
              { targetOrigin: "*" },
            );
          });
        });
      } else if (event.data && event.data.name === "plugin-piskel-unloaded") {
        delete targetWindowMap[event.data.tid];
        delete pendingTargetCostumes[event.data.tid];
      } else if (event.data && event.data.name === "plugin-piskel-loaded") {
        targetWindowMap[event.data.tid] = event.source;
      }
    };

    const syncTimerHandler = () => {
      for (const targetId of Object.keys(pendingTargetCostumes)) {
        const costumeIds = pendingTargetCostumes[targetId];
        if (!targetWindowMap[targetId]) {
          continue;
        }
        for (let i = 0; i < costumeIds.length; i++) {
          const costumeId = costumeIds[i];
          const costume = vm.editingTarget.getCostumeById(costumeId);
          if (costume) {
            targetWindowMap[targetId].postMessage(
              {
                name: "plugin-piskel-data",
                data: {
                  name: costume.name,
                  costumeId: costumeId,
                  dataFormat: costume.dataFormat,
                  assetData: costume.asset.data,
                  bitmapResolution: costume.bitmapResolution,
                  size: costume.size,
                  rotationCenter: [costume.rotationCenterX, costume.rotationCenterY],
                },
              },
              { targetOrigin: "*" },
            );
          }
        }
        delete pendingTargetCostumes[targetId];
      }
      if (syncTimer && pendingTargetCostumes.size === 0) {
        clearInterval(syncTimer);
        syncTimer = null;
      }
    };

    window.addEventListener("message", handleCostumeMessage, false);

    utils.expandCostumeContextMenuItems([
      {
        key: "piskelUpdateCostume",
        text: msg("plugins.costumePiskel.openCostume"),
        handleCallback: (_, costumeId) => {
          if (!targetWindowMap[vm.editingTarget.id]) {
            window.open(
              `${piskelHost}?tid=${encodeURIComponent(vm.editingTarget.id)}&tname=${encodeURIComponent(vm.editingTarget.getName())}`,
              "_blank",
            );
          }
          if (pendingTargetCostumes[vm.editingTarget.id] && pendingTargetCostumes[vm.editingTarget.id].length) {
            pendingTargetCostumes[vm.editingTarget.id].push(costumeId);
          } else {
            pendingTargetCostumes[vm.editingTarget.id] = [costumeId];
          }
          if (!syncTimer) {
            syncTimer = setInterval(syncTimerHandler, 1000);
          }
        },
      },
    ]);

    utils.expandCostumeMenuItems([
      {
        id: "piskelNewCostume",
        img: "https://www.piskelapp.com/static/resources/favicon.png",
        title: msg("plugins.costumePiskel.newCostume"),
        onClick: () => {
          if (!targetWindowMap[vm.editingTarget.id]) {
            window.open(
              `${piskelHost}?tid=${encodeURIComponent(vm.editingTarget.id)}&tname=${encodeURIComponent(vm.editingTarget.getName())}`,
              "_blank",
            );
          }
        },
      },
    ]);

    return () => {
      utils.removeCostumeContextMenuItems(["piskelUpdateCostume"]);
      utils.removeCostumeMenuItems(["piskelNewCostume"]);
      window.removeEventListener("message", handleCostumeMessage);
      if (syncTimer) {
        clearInterval(syncTimer);
        syncTimer = null;
      }
    };
  }, []);

  return null;
};

CostumePiskel.displayName = "CostumePiskel";

export default CostumePiskel;
