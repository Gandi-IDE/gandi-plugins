import * as React from "react";
import DataCategoryTweaksIcon from "src/assets/icon--data-category-tweaks.svg";
import ListIcon from "src/assets/icon--list.svg?url";
import VariablesIcon from "src/assets/icon--variables.svg?url";

const DataCategoryTweaks: React.FC<PluginContext> = ({ vm, blockly, workspace, msg, registerSettings }) => {
  React.useEffect(() => {
    let hasSeparateListCategory = false;
    let hasSeparateLocalVariables = false;
    let hasMoveReportersDown = false;
    let style: HTMLStyleElement | null = null;
    const setHasSeparateListCategory = (value: boolean) => {
      if (value) {
        style = document.createElement("style");
        style.innerHTML = `
          [theme="light"] .scratchCategoryMenuRow:nth-child(-n+10) .scratchCategoryItemIcon {
            filter: invert(90%);
          }
        `;
        document.head.appendChild(style);
      } else if (style) {
        style.remove();
      }
      hasSeparateListCategory = value;
    };

    const register = registerSettings(
      msg("plugins.dataCategoryTweaks.title"),
      "plugin-data-category-tweaks",
      [
        {
          key: "config",
          label: msg("plugins.dataCategoryTweaks.title"),
          items: [
            {
              key: "separateListCategory",
              label: msg("plugins.dataCategoryTweaks.separateListCategory"),
              type: "switch",
              value: hasSeparateListCategory,
              onChange: (value: boolean) => {
                setHasSeparateListCategory(value);
                if (vm.editingTarget) {
                  vm.emitWorkspaceUpdate();
                }
              },
            },
            {
              key: "separateLocalVariables",
              label: msg("plugins.dataCategoryTweaks.separateLocalVariables"),
              type: "switch",
              value: hasSeparateLocalVariables,
              onChange: (value: boolean) => {
                hasSeparateLocalVariables = value;
                if (workspace) {
                  workspace.refreshToolboxSelection_();
                }
              },
            },
            {
              key: "moveReportersDown",
              label: msg("plugins.dataCategoryTweaks.moveReportersDown"),
              type: "switch",
              value: hasMoveReportersDown,
              onChange: (value: boolean) => {
                hasMoveReportersDown = value;
                if (workspace) {
                  workspace.refreshToolboxSelection_();
                }
              },
            },
          ],
        },
      ],
      <DataCategoryTweaksIcon />,
    );

    const runtime = vm.runtime as any;
    const ScratchBlocks = blockly;

    const SMALL_GAP = 8;
    const BIG_GAP = 24;

    const separateVariablesByType = (toolboxXML) => {
      const listButtonIndex = toolboxXML.findIndex(
        (i) => i.getAttribute("callbackkey") === "CREATE_LIST" || i.getAttribute("type") === "data_addtolist",
      );
      return {
        variables: toolboxXML.slice(0, listButtonIndex),
        lists: toolboxXML.slice(listButtonIndex, toolboxXML.length),
      };
    };

    const separateLocalVariables = (workspace, toolboxXML) => {
      const { variables, lists } = separateVariablesByType(toolboxXML);

      const makeLabel = (l10n) => {
        const label = document.createElement("label");
        label.setAttribute("text", msg(l10n));
        return label;
      };

      const fixGaps = (variables) => {
        if (variables.length > 0) {
          for (var i = 0; i < variables.length - 1; i++) {
            variables[i].setAttribute("gap", SMALL_GAP);
          }
          variables[i].setAttribute("gap", BIG_GAP);
        }
      };

      const separateVariablesByScope = (xml) => {
        const before = [];
        const global = [];
        const local = [];
        const after = [];

        for (const blockXML of xml) {
          if (blockXML.hasAttribute("id")) {
            const id = blockXML.getAttribute("id");
            const variable = workspace.getVariableById(id);
            if (!variable || !variable.isLocal) {
              global.push(blockXML);
            } else {
              local.push(blockXML);
            }
          } else if (global.length || local.length) {
            after.push(blockXML);
          } else {
            before.push(blockXML);
          }
        }

        const result = before;

        if (global.length) {
          result.push(makeLabel("for-all-sprites"));
          fixGaps(global);
          result.push(...global);
        }

        if (local.length) {
          result.push(makeLabel("for-this-sprite-only"));
          fixGaps(local);
          result.push(...local);
        }

        return result.concat(after);
      };

      return separateVariablesByScope(variables).concat(separateVariablesByScope(lists));
    };

    const moveReportersDown = (toolboxXML) => {
      const { variables, lists } = separateVariablesByType(toolboxXML);

      const moveReportersToEnd = (xml) => {
        const reporters = [];
        const everythingElse = [];

        for (const blockXML of xml) {
          if (blockXML.hasAttribute("id") || blockXML.tagName === "BUTTON") {
            // Round reporters and the create variable button
            reporters.push(blockXML);
          } else {
            // Everything else like "change variable by 1"
            everythingElse.push(blockXML);
          }
        }

        if (everythingElse.length) {
          everythingElse[everythingElse.length - 1].setAttribute("gap", BIG_GAP);
        }

        return everythingElse.concat(reporters);
      };

      return moveReportersToEnd(variables).concat(moveReportersToEnd(lists));
    };

    const DataCategory = ScratchBlocks.DataCategory;
    let variableCategory;
    let listCategory;
    const variableCategoryCallback = (workspace) => {
      let result = DataCategory(workspace);

      if (hasMoveReportersDown) {
        result = moveReportersDown(result);
      }

      if (hasSeparateLocalVariables) {
        result = separateLocalVariables(workspace, result);
      }

      if (!hasSeparateListCategory) {
        return result;
      }

      /*
      if (!addon.self.disabled && addon.settings.get("moveReportersDown")) {
        result = moveReportersDown(result);
      }

      if (!addon.self.disabled && addon.settings.get("separateLocalVariables")) {
        result = separateLocalVariables(workspace, result);
      }

      if (!hasSeparateListCategory) {
        return result;
      }
      */

      const { variables, lists } = separateVariablesByType(result);
      variableCategory = variables;
      listCategory = lists;
      return variableCategory;
    };
    const listCategoryCallback = () => {
      // Computed in variable category callback, which should be called before this method.
      return listCategory;
    };

    // Each time a new workspace is made, these callbacks are reset, so re-register whenever a flyout is shown.
    // https://github.com/scratchfoundation/scratch-blocks/blob/61f02e4cac0f963abd93013842fe536ef24a0e98/core/flyout_base.js#L469
    const oldShow = ScratchBlocks.Flyout.prototype.show;
    ScratchBlocks.Flyout.prototype.show = function (xmlList) {
      this.workspace_.registerToolboxCategoryCallback("VARIABLE", variableCategoryCallback);
      this.workspace_.registerToolboxCategoryCallback("LIST", listCategoryCallback);
      return oldShow.call(this, xmlList);
    };

    // Use Scratch's extension category mechanism to replace the data category with our own.
    // https://github.com/scratchfoundation/scratch-gui/blob/ddd2fa06f2afa140a46ec03be91796ded861e65c/src/containers/blocks.jsx#L344
    // https://github.com/scratchfoundation/scratch-gui/blob/2ceab00370ad7bd8ecdf5c490e70fd02152b3e2a/src/lib/make-toolbox-xml.js#L763
    // https://github.com/scratchfoundation/scratch-vm/blob/a0c11d6d8664a4f2d55632e70630d09ec6e9ae28/src/engine/runtime.js#L1381
    const originalGetBlocksXML = runtime.getBlocksXML;
    runtime.getBlocksXML = function (target) {
      const result = originalGetBlocksXML.call(this, target);

      if (hasSeparateListCategory) {
        result.push({
          id: "data",
          xml: `
          <category
            name="%{BKY_CATEGORY_VARIABLES}"
            id="variables"
            iconURI="${VariablesIcon}"
            colour="${ScratchBlocks.Colours.data.primary}"
            secondaryColour="${ScratchBlocks.Colours.data.tertiary}"
            custom="VARIABLE">
          </category>
          <category
            name="${msg("plugins.dataCategoryTweaks.list")}"
            id="lists"
            iconURI="${ListIcon}"
            colour="${ScratchBlocks.Colours.data_lists.primary}"
            secondaryColour="${ScratchBlocks.Colours.data_lists.tertiary}"
            custom="LIST">
          </category>`,
        });
        result.map = (callback) => {
          // Prevent Scratch from trying to change the color of the added category in high contrast mode.
          // https://github.com/scratchfoundation/scratch-gui/blob/44eb578/src/containers/blocks.jsx#L358-L361
          // https://github.com/scratchfoundation/scratch-gui/blob/44eb578/src/lib/themes/blockHelpers.js#L18-L53
          return Array.prototype.map.call(result, (extension) => {
            if (extension.id === "data") return extension;
            else return callback(extension);
          });
        };
      }
      return result;
    };

    // If editingTarget is set, the editor has already rendered and we have to tell it to rerender.
    if (vm.editingTarget) {
      vm.emitWorkspaceUpdate();
    }

    return () => {
      const shouldEmitWorkspaceUpdate = vm.editingTarget && hasSeparateListCategory;
      const shouldRefreshToolboxSelection = workspace && hasSeparateLocalVariables && hasMoveReportersDown;
      // Set all states to their default and refresh the UI
      setHasSeparateListCategory(false);
      hasSeparateLocalVariables = false;
      hasMoveReportersDown = false;
      if (shouldEmitWorkspaceUpdate) vm.emitWorkspaceUpdate();
      if (shouldRefreshToolboxSelection) workspace.refreshToolboxSelection_();
      // Restore an overridden function to its original implementation.
      runtime.getBlocksXML = originalGetBlocksXML;
      ScratchBlocks.Flyout.prototype.show = oldShow;

      register.dispose();
    };
  }, [vm, blockly, workspace, msg, registerSettings]);

  return null;
};

DataCategoryTweaks.displayName = "Data category tweaks";

export default DataCategoryTweaks;
