import * as React from "react";
import styles from "./styles.less";
import ReactMarkdown from "react-markdown";
import CleanProIcon from "../../assets/icon--clean-pro.svg";
const CleanPro: React.FC<PluginContext> = ({ intl, vm, workspace, registerSettings, msg }) => {
  React.useEffect(() => {
    const menuItemId = window.Blockly.ContextMenu.addDynamicMenuItem(
      (items, target) => {
        items.push({
          id: "cleanPro",
          text: msg("plugins.cleanPro.cleanHeadlessBlocks"),
          enabled: true,
          callback: () => {
            const cleanHeadlessBlocks = () => {
              const currentTarget = vm.editingTarget;
              const blocks = currentTarget.blocks._blocks;

              window.Blockly.Events.setGroup(true);

              // 使用循环直到没有更多块可以删除
              let hasRemovedBlocks = true;
              while (hasRemovedBlocks) {
                hasRemovedBlocks = false;

                // 获取当前的块列表
                const blockIds = Object.keys(currentTarget.blocks._blocks);

                // 找出所有顶级块（没有父块的块）
                const topBlocks = blockIds.filter((id) => {
                  const block = currentTarget.blocks._blocks[id];
                  return !block.parent;
                });

                // 遍历所有顶级块
                for (const id of topBlocks) {
                  const block = workspace.getBlockById(id);
                  if (block) {
                    const isHat = block.type.includes("when") || block.type.includes("event");
                    const hasNextBlock = block.getNextBlock() !== null;

                    if (!isHat || (isHat && !hasNextBlock)) {
                      // 删除拼在他下面的blocks
                      block.getChildren(true).forEach((child) => {
                        child.dispose(true);
                      });
                      block.dispose(true);
                      hasRemovedBlocks = true;
                    }
                  }
                }
              }

              window.Blockly.Events.setGroup(false);
            };

            cleanHeadlessBlocks();
          },
        });
        return items;
      },
      {
        targetNames: ["workspace"], // 可以是 "workspace", "blocks", "frame", "comment" 等
      },
    );
    // 注册设置项
    const register = registerSettings(
      msg("plugins.cleanPro.title"),
      "plugin-clean-pro",
      [
        {
          key: "cleanPro",
          label: msg("plugins.cleanPro.title"),

          items: [
            {
              key: "cleanHeadlessBlocks",
              label: "插件文档",
              type: "input",
              inputProps: {
                type: "input",
                onFocus: (e) => {
                  e.target.blur();
                },
              },
              value: " ",
              description: <ReactMarkdown>{msg("plugins.cleanPro.docs")}</ReactMarkdown>,
              onChange: (value: boolean) => {},
            },
          ],
        },
      ],
      <CleanProIcon />,
    );

    return () => {
      window.Blockly.ContextMenu.deleteDynamicMenuItem(menuItemId);
      register.dispose();
    };
  }, [vm, workspace]);

  return <React.Fragment>{"Clean Pro Plugin"}</React.Fragment>;
};

CleanPro.displayName = "CleanPro";

export default CleanPro;
