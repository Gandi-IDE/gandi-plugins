import type { SelectedElements } from "src/plugins/code-batch-select/useBatchSelect";
import BlockFlasher from "utils/block-flasher";

type CopiedElements = [
  Array<{
    element: Element;
    originalELement: Blockly.Block;
    nextBlockId?: string;
  }>,
  Array<{
    element: Element;
    originalELement: Blockly.Frame;
  }>,
];

const changeObscuredShadowIds = (element: Element) => {
  const shadows = element.getElementsByTagName("shadow");
  for (let index = 0; index < shadows.length; index++) {
    shadows[index].setAttribute("id", window.Blockly.Utils.genUid());
  }
};

const resolveVariableSharingConflicts = (element: Element, workspace: Blockly.Workspace, vm: VirtualMachine) => {
  const variables: Map<string, string> = new Map();
  const lists: Map<string, string> = new Map();
  const existingVariables = workspace.getAllVariables().map(({name, type, isCloud, id_}) => ({name, type,isCloud, id: id_}));
  
  const handleCheckVariable = (name: string, id: string, type: string, element: Element) => {
    const existingVariable = existingVariables.find((i) => i.type === type && i.name === name);
    if (!existingVariable) {
      const isCloud = name.startsWith("☁ ");
      vm.editingTarget.createVariable(id, name, type, isCloud);
      existingVariables.push({name, type, isCloud, id})
    } else if (existingVariable.id !== id) {
      element.setAttribute("id", existingVariable.id);
    }
  };

  function traverse(node: Element) {
    const children: HTMLCollection = node.children;

    for (let i = 0; i < children.length; i++) {
      const child = children[i] as Element;
      if (child.tagName === "FIELD") {
        const type = child.getAttribute("name");
        const name = child.innerHTML;
        const id = child.getAttribute("id");
        if (type === "VARIABLE") {
          handleCheckVariable(name, id, "", child);
        } else if (type === "LIST") {
          handleCheckVariable(name, id, "list", child);
        }
      }
      traverse(child);
    }
  }

  traverse(element);

  return { variables, lists };
};

/**
 * Flesh out a blocks description
 * @param block Block Object
 * @param allBlockIds All the block ids that need to be processed
 * @returns Block description
 */
export const getBlockDescription = (block: Blockly.Block, allBlockIds: Set<string>) => {
  let desc = "";
  const process = ({ inputList }: Blockly.Block) => {
    for (const input of inputList) {
      const fields = input.fieldRow;
      for (const field of fields) {
        const text = field.getText();
        desc = (desc ? `${desc} ` : "") + text;
      }
      if (input.connection) {
        const innerBlock = input.connection.targetBlock();
        if (innerBlock && !allBlockIds.has(innerBlock.id)) {
          process(innerBlock);
        }
      }
    }
  };
  process(block);
  return desc;
};

/**
 * Find the top stack block of a stack
 * @param block in a stack
 * @returns a block that is the top of the stack of blocks
 */
export const getTopOfStackFor = (block: Blockly.Block) => {
  let base = block;
  while (base.getOutputShape() && base.getSurroundParent()) {
    base = base.getSurroundParent();
  }
  return base;
};

/**
 * Based on wksp.centerOnBlock(blockId);
 * @param {object} block A Blockly.Block
 * @param {object} workspace Blockly.Workspace
 */
export const scrollBlockIntoView = (block: Blockly.Block, workspace: Blockly.WorkspaceSvg) => {
  if (!block) {
    return console.warn("Block not found");
  }
  const offsetX = 32;
  const offsetY = 32;
  const root = block.getRootBlock();
  const base = getTopOfStackFor(block);
  const ePos = base.getRelativeToSurfaceXY(); // Align with the top of the block
  const rPos = root.getRelativeToSurfaceXY(); // Align with the left of the block 'stack'
  const scale = workspace.scale;
  const x = rPos.x * scale;
  const y = ePos.y * scale;
  const xx = block.width + x;
  const yy = block.height + y;
  const s = workspace.getMetrics();
  if (
    x < s.viewLeft + offsetX - 4 ||
    xx > s.viewLeft + s.viewWidth ||
    y < s.viewTop + offsetY - 4 ||
    yy > s.viewTop + s.viewHeight
  ) {
    const sx = x - s.contentLeft - offsetX;
    const sy = y - s.contentTop - offsetY;

    workspace.scrollbar?.set(sx, sy);
  }
  BlockFlasher.start(block);
};

export const getBlockNextConnectionBlocks = (block) => {
  let ids = [];
  if (block.nextConnection?.targetConnection) {
    const sourceBlock_ = block.nextConnection.targetConnection.sourceBlock_;
    ids.push(sourceBlock_.id);
    const childResult = getChildBlocks(sourceBlock_);
    const nextResult = getBlockNextConnectionBlocks(sourceBlock_);
    ids = [...ids, ...childResult, ...nextResult];
  }
  return ids;
};

export const getChildBlocks = (block) => {
  let ids = [];
  const currentChildBlocks = block.childBlocks_.filter(
    (it) => !it.isShadow_ && it.id !== block.nextConnection?.targetConnection?.sourceBlock_.id,
  );
  currentChildBlocks.forEach((it) => {
    ids.push(it.id);
    const childResult = getChildBlocks(it);
    const nextResult = getBlockNextConnectionBlocks(it);
    ids = [...ids, ...childResult, ...nextResult];
  });
  return ids;
};

// 从当前选中的blocks中拿到当前block所在块结尾Block的next
export const getActivityEndBlockNext = (block, activeBlocks) => {
  while (
    block.nextConnection?.targetConnection?.sourceBlock_ &&
    activeBlocks.findIndex((it) => it.id === block.nextConnection?.targetConnection?.sourceBlock_.id) !== -1
  ) {
    block = block.nextConnection?.targetConnection?.sourceBlock_;
  }
  const nextBlock = block.getNextBlock();
  return nextBlock;
};

export const draggingBatchedElementAnimation = (
  element: Blockly.Block | Blockly.Frame,
  isBlock: boolean,
  processedTargetBlock?: Blockly.Block,
) => {
  const animateBlock = element.getSvgRoot().cloneNode(true) as SVGAElement;
  element.getSvgRoot().style.display = "none";
  document.querySelector(".blocklySvg .blocklyWorkspace .blocklyBlockCanvas").appendChild(animateBlock);
  animateBlock.setAttribute("style", "transition: all .3s linear;");

  const targetBlockTransform = (processedTargetBlock || element).getSvgRoot().getAttribute("transform");
  setTimeout(() => {
    animateBlock.setAttribute("transform", targetBlockTransform);
    animateBlock.setAttribute("style", "transition: all .3s linear; opacity: 0;");
    setTimeout(() => {
      animateBlock.remove();
    }, 300);
  });
  if (isBlock) {
    let setCommentStyleBlock = element as Blockly.Block;
    do {
      if (setCommentStyleBlock?.comment?.bubble_?.bubbleGroup_) {
        setCommentStyleBlock.comment.bubble_.bubbleGroup_.setAttribute("style", "display: none");
      }
      setCommentStyleBlock = setCommentStyleBlock?.nextConnection?.targetConnection?.sourceBlock_;
    } while (setCommentStyleBlock);
  }
};

export const draggingBatchedElements = (selectedElements: SelectedElements, processedTargetBlock?: Blockly.Block) => {
  const selectedBlocks = Object.values(selectedElements[0]);
  const selectedFrames = Object.values(selectedElements[1]);

  // 获取所选中的blocks的headBlock;
  const batchedBlocks = selectedBlocks.filter(
    (block) => !block.parentBlock_ || !selectedElements[0][block.parentBlock_.id],
  );
  if (!window.Blockly.Events.getGroup()) {
    // this drag operates set groups.
    window.Blockly.Events.setGroup(true);
  }
  // 处理所有选中的batchedBlocks都应该上下断连。
  const isBatchElement = batchedBlocks.length + selectedFrames.length !== 1;

  batchedBlocks.forEach((cpl) => {
    let [firstBlock, lastBlock] = [cpl, cpl];
    while (firstBlock.parentBlock_ && selectedElements[0][firstBlock.parentBlock_.id]) {
      firstBlock = firstBlock.parentBlock_;
    }
    while (
      lastBlock.nextConnection?.targetConnection?.sourceBlock_ &&
      selectedElements[0][lastBlock.nextConnection.targetConnection.sourceBlock_.id]
    ) {
      lastBlock = lastBlock.nextConnection.targetConnection.sourceBlock_;
    }
    // 单积木直接unplug
    if (firstBlock.id === lastBlock.id) {
      firstBlock.unplug(true);
    } else {
      // 重新链接最上层block和最下层block
      const nextBlock = lastBlock.getNextBlock();
      let nextTarget;
      if (nextBlock) {
        nextTarget = lastBlock.nextConnection.targetConnection;
        nextTarget.disconnect();
      }
      if (firstBlock.previousConnection?.isConnected()) {
        const previousTarget = firstBlock.previousConnection.targetConnection;
        firstBlock.previousConnection.disconnect();
        if (nextTarget && previousTarget && previousTarget.checkType_(nextTarget)) {
          // Attach the next statement to the previous statement.
          previousTarget.connect(nextTarget);
        }
      }
    }

    // 已选中的数据超出一个代码块，才算作为多选
    if (isBatchElement) {
      draggingBatchedElementAnimation(firstBlock, true, processedTargetBlock);
    }
  });

  selectedFrames.forEach((frame) => {
    if (isBatchElement) {
      draggingBatchedElementAnimation(frame, true);
    }
  });

  return {
    isBatchElement,
    temporaryBatchElements: [batchedBlocks, selectedFrames],
  };
};

export const copyBatchedElements = (selectedElements: SelectedElements) => {
  const selectedBlocks = Object.values(selectedElements[0]);
  const selectedFrames = Object.values(selectedElements[1]);
  const copiedBlocks = selectedBlocks.reduce((acc, block) => {
    if (!block.parentBlock_ || !selectedElements[0][block.parentBlock_.id]) {
      const nextBlock = getActivityEndBlockNext(block, selectedBlocks);
      const element = window.Blockly.Xml.blockToDom(block, false, nextBlock?.id, true);
      const xy = block.getRelativeToSurfaceXY();
      element.setAttribute("originalX", String(block.RTL ? -xy.x : xy.x));
      element.setAttribute("originalY", String(xy.y));
      return [
        ...acc,
        {
          element,
          originalELement: block,
          nextBlockId: nextBlock?.id,
        },
      ];
    }
    return acc;
  }, []);
  const copiedFrames = selectedFrames.reduce((acc, frame) => {
    const element = window.Blockly.Xml.frameToDom(frame, true);
    const xy = frame.getBoundingFrameRect();
    element.setAttribute("originalX", String(frame.RTL ? -xy.x : xy.x));
    element.setAttribute("originalY", String(xy.y));
    return [
      ...acc,
      {
        element,
        originalELement: frame,
      },
    ];
  }, []);

  return [copiedBlocks, copiedFrames];
};

export const pasteBatchedElements = (
  event: { clientX: number; clientY: number },
  workspace: Blockly.Workspace,
  copiedElements: CopiedElements,
  vm: VirtualMachine,
) => {
  const mouseRelativePosition = window.Blockly.Utils.getMouseVectorPosition(
    {
      clientX: event.clientX,
      clientY: event.clientY,
    },
    workspace,
  );
  window.Blockly.Events.setGroup(true);
  const elements: Array<{ element: Element }> = [...copiedElements[0], ...copiedElements[1]];
  const startOriginPosition = elements.reduce(
    (pre, next) => {
      const { element } = next;
      const x = Number(element.getAttribute("originalX"));
      const y = Number(element.getAttribute("originalY"));
      return {
        x: Math.min(pre.x || x, x),
        y: Math.min(pre.y || y, y),
      };
    },
    { x: null, y: null },
  );
  const dx = mouseRelativePosition.x - startOriginPosition.x;
  const dy = mouseRelativePosition.y - startOriginPosition.y;
  elements.forEach((bl) => {
    const { element } = bl;
    const x = Number(element.getAttribute("originalX"));
    const y = Number(element.getAttribute("originalY"));

    element.setAttribute("x", String(x + dx));
    element.setAttribute("y", String(y + dy));

    resolveVariableSharingConflicts(element, workspace, vm);

    if (element.tagName.toLowerCase() === "custom-frame") {
      let xmlBlock = null;
      for (let i = 0; i < element.children.length; i++) {
        xmlBlock = element.children[i];
        xmlBlock.setAttribute("x", String(Number(xmlBlock.getAttribute("x")) + dx));
        xmlBlock.setAttribute("y", String(Number(xmlBlock.getAttribute("y")) + dy));
      }
    }

    // Scratch-specific: Give shadow dom new IDs to prevent duplicating on paste
    changeObscuredShadowIds(element);
    const xml = `<xml xmlns="http://www.w3.org/1999/xhtml">${element.outerHTML}</xml>`;
    const xmlDOM = window.Blockly.Xml.textToDom(xml);
    const mutations = xmlDOM.getElementsByTagName("mutation");
    for (let index = 0; index < mutations.length; index++) {
      const element = mutations[index];
      const blockInfo = element.getAttribute("blockinfo");
      if (blockInfo) {
        element.removeAttribute("blockinfo");
        element.setAttribute("blockInfo", blockInfo);
      }
    }
    window.Blockly.Xml.domToWorkspace(xmlDOM, workspace);
  });
  window.Blockly.Events.setGroup(false);
};
