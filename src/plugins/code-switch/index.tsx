import React, { useEffect } from "react";
import { blockSwitches } from "./const";

const CodeSwitch: React.FC<PluginContext> = ({ intl, vm }) => {
  const parseArguments = (code) =>
    code
      .split(/(?=[^\\]%[nbs])/g)
      .map((i) => i.trim())
      .filter((i) => i.charAt(0) === "%")
      .map((i) => i.substring(0, 2));

  const getCustomBlocks = () => {
    const customBlocks = {};
    const target = vm.editingTarget;
    Object.values(target.blocks._blocks)
      .filter((block) => block.opcode === "procedures_prototype")
      .forEach((block) => {
        const procCode = block.mutation.proccode;
        const argumentNames = JSON.parse(block.mutation.argumentnames);
        // argumentdefaults is unreliable, so we have to parse the procedure code to determine argument types
        const parsedArguments = parseArguments(procCode);
        const stringArgs = [];
        const boolArgs = [];
        for (let i = 0; i < argumentNames.length; i++) {
          if (parsedArguments[i] === "%b") {
            boolArgs.push(argumentNames[i]);
          } else {
            stringArgs.push(argumentNames[i]);
          }
        }
        customBlocks[procCode] = {
          stringArgs,
          boolArgs,
        };
      });
    return customBlocks;
  };

  /**
   * @param {*} workspace
   * @param {Element} xmlBlock
   */
  const pasteBlockData = (workspace, xmlBlock) => {
    // but without the collision checking.
    const block = window.Blockly.Xml.domToBlock(xmlBlock, workspace);
    const x = +xmlBlock.getAttribute("x");
    const y = +xmlBlock.getAttribute("y");
    // Don't need to handle RTL here
    block.moveBy(x, y);
    return block;
  };
  /**
   * @template T
   * @param {T|()=>T} value
   * @returns {T}
   */
  const callIfFunction = (value) => {
    if (typeof value === "function") {
      return value();
    }
    return value;
  };

  /**
   * @param {string} shadowType The type of shadow eg. "math_number"
   * @returns {string} The name of the shadow's inner field that contains the user-visible value
   */
  const getShadowFieldName = (shadowType) => {
    // This is non-comprehensive.
    if (shadowType === "text") {
      return "TEXT";
    }
    if (shadowType === "colour_picker") {
      return "COLOUR";
    }
    return "NUM";
  };

  /**
   * @description 选择替换积木的回调函数
   */
  const menuCallbackFactory = (block, opcodeData) => () => {
    if (opcodeData.isNoop) {
      return;
    }

    if (opcodeData.fieldValue) {
      block.setFieldValue(opcodeData.fieldValue, "VALUE");
      return;
    }

    try {
      window.Blockly.Events.setGroup(true);
      const workspace = block.workspace;

      const blocksToBringToForeground = [];
      // Split inputs before we clone the block.
      if (opcodeData.splitInputs) {
        for (const inputName of opcodeData.splitInputs) {
          const input = block.getInput(inputName);
          if (!input) {
            continue;
          }
          const connection = input.connection;
          if (!connection) {
            continue;
          }
          if (connection.isConnected()) {
            const targetBlock = connection.targetBlock();
            if (targetBlock.isShadow()) {
              // Deleting shadows is handled later.
            } else {
              connection.disconnect();
              blocksToBringToForeground.push(targetBlock);
            }
          }
        }
      }

      // Make a copy of the block with the proper type set.
      // It doesn't seem to be possible to change a Block's type after it's created, so we'll just make a new block instead.
      const xml = window.Blockly.Xml.blockToDom(block);
      // blockToDomWithXY's handling of RTL is strange, so we encode the position ourselves.
      const position = block.getRelativeToSurfaceXY();
      xml.setAttribute("x", position.x);
      xml.setAttribute("y", position.y);
      if (opcodeData.opcode) {
        xml.setAttribute("type", opcodeData.opcode);
      }

      const parentBlock = block.getParent();
      let parentConnection;
      let blockConnectionType;
      if (parentBlock) {
        // If the block has a parent, find the parent -> child connection that will be reattached later.
        const parentConnections = parentBlock.getConnections_();
        parentConnection = parentConnections.find(
          (c) => c.targetConnection && c.targetConnection.sourceBlock_ === block,
        );
        // There's two types of connections from child -> parent. We need to figure out which one is used.
        const blockConnections = block.getConnections_();
        const blockToParentConnection = blockConnections.find(
          (c) => c.targetConnection && c.targetConnection.sourceBlock_ === parentBlock,
        );
        blockConnectionType = blockToParentConnection.type;
      }

      // Array.from creates a clone of the children list. This is important as we may remove
      // children as we iterate.
      for (const child of Array.from(xml.children) as [any]) {
        const oldName = (child as any).getAttribute("name");

        // Any inputs that were supposed to be split that were not should be removed.
        // (eg. shadow inputs)
        if (opcodeData.splitInputs && opcodeData.splitInputs.includes(oldName)) {
          xml.removeChild(child);
          continue;
        }

        const newName = opcodeData.remapInputName && opcodeData.remapInputName[oldName];
        if (newName) {
          child.setAttribute("name", newName);
        }

        const newShadowType = opcodeData.remapShadowType && opcodeData.remapShadowType[oldName];
        if (newShadowType) {
          const valueNode = child.firstChild;
          const fieldNode = valueNode.firstChild;
          valueNode.setAttribute("type", newShadowType);
          fieldNode.setAttribute("name", getShadowFieldName(newShadowType));
        }

        const fieldValueMap = opcodeData.mapFieldValues && opcodeData.mapFieldValues[oldName];
        if (fieldValueMap && child.tagName === "FIELD") {
          const oldValue = child.innerText;
          const newValue = fieldValueMap[oldValue];
          if (typeof newValue === "string") {
            child.innerText = newValue;
          }
        }
      }

      if (opcodeData.mutate) {
        const mutation = xml.querySelector("mutation");
        for (const [key, value] of Object.entries(opcodeData.mutate as Record<string, string>)) {
          mutation.setAttribute(key, value);
        }
      }

      if (opcodeData.createInputs) {
        for (const [inputName, inputData] of Object.entries(opcodeData.createInputs) as any[]) {
          const valueElement = document.createElement("value");
          valueElement.setAttribute("name", inputName);

          const shadowElement = document.createElement("shadow");
          shadowElement.setAttribute("type", inputData.shadowType);

          const shadowFieldElement = document.createElement("field");
          shadowFieldElement.setAttribute("name", getShadowFieldName(inputData.shadowType));
          shadowFieldElement.innerText = callIfFunction(inputData.value);

          shadowElement.appendChild(shadowFieldElement);
          valueElement.appendChild(shadowElement);
          xml.appendChild(valueElement);
        }
      }

      // Remove the old block and insert the new one.
      block.dispose();
      const newBlock = pasteBlockData(workspace, xml);

      if (parentConnection) {
        // Search for the same type of connection on the new block as on the old block.
        const newBlockConnections = newBlock.getConnections_();
        const newBlockConnection = newBlockConnections.find((c) => c.type === blockConnectionType);
        newBlockConnection.connect(parentConnection);
      }

      for (const otherBlock of blocksToBringToForeground) {
        // By re-appending the element, we move it to the end, which will make it display
        // on top.
        const svgRoot = otherBlock.getSvgRoot();
        svgRoot.parentNode.appendChild(svgRoot);
      }
    } finally {
      window.Blockly.Events.setGroup(false);
    }
  };

  useEffect(() => {
    // 创建下拉菜单
    const menuItemId = window.Blockly.ContextMenu.addDynamicMenuItem(
      (items, target) => {
        const block = target as unknown as Blockly.Block;
        const type = block.type;
        let switches = blockSwitches[type] || [];
        const customBlocks = getCustomBlocks();
        // 自定义积木参数替换逻辑
        // all -> 可以替换所以自定义积木中的积木
        // defOnly -> 只能替换当前自定义积木中的积木
        if (["argument_reporter_string_number", "argument_reporter_boolean"].includes(type) && !block.isShadow()) {
          const root = block.getRootBlock();
          if (root.type !== "procedures_definition") return items;
          const customBlockObj = customBlocks[root.getChildren(true)[0].getProcCode()];
          switch (type) {
            case "argument_reporter_string_number":
              switches = customBlockObj.stringArgs;
              break;
            case "argument_reporter_boolean":
              switches = customBlockObj.boolArgs;
              break;
          }
          // }
          const currentValue = block.getFieldValue("VALUE");
          switches = switches.map((i) => ({
            isNoop: i === currentValue,
            fieldValue: i,
            msg: i,
          }));
        }

        // 不需要在下拉框中展示自己，所以过滤掉自己。
        switches = switches.filter((i) => !i.isNoop);
        switches.forEach((opcodeData, i) => {
          const makeSpaceItemIndex = items.findIndex((obj) => obj._isDevtoolsFirstItem);
          const insertBeforeIndex =
            makeSpaceItemIndex !== -1
              ? // If "make space" button exists, add own items before it
                makeSpaceItemIndex
              : // If there's no such button, insert at end
                items.length;
          const text = opcodeData.msg
            ? opcodeData.msg
            : intl.formatMessage({
                id: `plugins.codeSwitching.${opcodeData.opcode}`,
              });
          items.splice(insertBeforeIndex, 0, {
            id: opcodeData.opcode,
            enabled: true,
            text: text,
            callback: menuCallbackFactory(block, opcodeData),
            separator: i === 0,
            isSWitchMenu: true,
          });
        });
        return items;
      },
      { targetNames: ["blocks"] },
    );
    // 单独注销掉menu。
    return () => {
      window.Blockly.ContextMenu.deleteDynamicMenuItem(menuItemId);
    };
  }, []);

  return <></>;
};

export default CodeSwitch;
