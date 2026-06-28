type BlockJSONconfig = {
  [K: `message${number}`]: string;
  category: string;
  [K: `args${number}`]: [
    {
      check: string;
      name: string;
      type: string;
    },
  ];
};

interface IBlockly {
  Blocks: Blockly.Blocks;
  Colours: Blockly.Colours;
}

const FALLBACK_COLOR = "#701111";

export function getInnerText(
  block: Scratch.BlockState,
  blocks: Scratch.Blocks,
  blockly: IBlockly,
): {
  innerBlockText: string;
  color: string;
} {
  if (!block) {
    return { innerBlockText: "", color: FALLBACK_COLOR };
  }
  let innerBlockId: string | null;
  if (blockIsFromGandiTerminal(block)) {
    innerBlockId = getGandiTerminalInnerBlockId(block);
  } else {
    // 一些扩展（如多莉pro）也会使用log system，这种情况下记录的块应该为触发log的块本身
    innerBlockId = block.id;
  }
  if (innerBlockId) {
    const innerBlock = blocks.getBlock(innerBlockId);
    const { opcode } = innerBlock;
    if (["text", "number"].includes(opcode)) {
      return { innerBlockText: "", color: FALLBACK_COLOR };
    }
    const { text: innerBlockText, color } = getBlockTextAndColor(innerBlock, blockly);
    return { innerBlockText, color };
  }
  return { innerBlockText: "", color: FALLBACK_COLOR };
}

export function blockIsFromGandiTerminal(block: Scratch.BlockState) {
  const { opcode } = block;
  return opcode.startsWith("GandiTerminal_") && ["log", "error", "warn", "trace"].includes(opcode.substring(14));
}

export function getGandiTerminalInnerBlockId(block: Scratch.BlockState): string | null {
  const { TEXT } = block.inputs;
  if (!TEXT) {
    return null;
  }
  return TEXT.block;
}

export function getBlockTextAndColor(block: Scratch.BlockState, blockly: IBlockly): { text: string; color: string } {
  const { opcode } = block;
  if (opcode.startsWith("procedures")) {
    const { mutation } = block;
    if (!("proccode" in mutation)) {
      return;
    }
    return {
      text: mutation.proccode.replace(/%./g, "()"),
      color: "#FF6680",
    };
  }
  if (opcode == "data_variable") {
    return { text: `(${block.fields["VARIABLE"].value})`, color: blockly.Colours.data.primary };
  }
  if (opcode == "data_listcontents") {
    return { text: `(${block.fields["LIST"].value})`, color: blockly.Colours.data_lists.primary };
  }
  if (!blockly.Blocks[opcode].init) {
    return { text: opcode, color: FALLBACK_COLOR };
  }
  let blockConfig: BlockJSONconfig;
  const blockInit = blockly.Blocks[opcode].init;
  blockInit.call({
    jsonInit(config: BlockJSONconfig) {
      blockConfig = config;
    },
  });
  if (!blockConfig!) {
    return { text: opcode, color: FALLBACK_COLOR };
  }
  if (!("message0" in blockConfig)) {
    return { text: opcode, color: FALLBACK_COLOR };
  }
  return { text: blockConfig["message0"].replace(/%\d/g, "()"), color: getBlockColor(blockConfig, blockly) };
}

export function getBlockColor(config: BlockJSONconfig, blockly: IBlockly) {
  if ("colour" in config) {
    return config.colour;
  }
  return getColorFromCategory(config.category, blockly) || FALLBACK_COLOR;
}

export function getColorFromCategory(category: string, blockly: IBlockly) {
  if (category in blockly.Colours) {
    if (!("primary" in blockly.Colours[category])) {
      return;
    }
    return blockly.Colours[category].primary;
  }
  return;
}
