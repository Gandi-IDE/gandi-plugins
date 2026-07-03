type BlockJSONconfig = {
  [K: `message${number}`]: string;
  category: string;
  [K: `args${number}`]: Array<{
    check?: string;
    name?: string;
    type: string;
    text?: string;
    alt?: string;
  }>;
};

export interface IBlockly {
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

export interface MinBlockState {
  opcode: string;
  mutation?: { proccode?: string };
  fields?: Record<string, { value: string }>;
}

export function getBlockTextAndColor(block: MinBlockState, blockly: IBlockly): { text: string; color: string } {
  const { opcode } = block;
  if (opcode.startsWith("procedures")) {
    const { mutation } = block;
    if (!mutation || !("proccode" in mutation)) {
      return;
    }
    return {
      text: mutation.proccode.replace(/%./g, "()"),
      color: "#FF6680",
    };
  }
  if (opcode == "data_variable" && block.fields) {
    return { text: `(${block.fields["VARIABLE"].value})`, color: blockly.Colours.data.primary };
  }
  if (opcode == "data_listcontents" && block.fields) {
    return { text: `(${block.fields["LIST"].value})`, color: blockly.Colours.data_lists.primary };
  }
  if (!blockly.Blocks[opcode].init) {
    return { text: opcode, color: FALLBACK_COLOR };
  }
  let blockConfig: BlockJSONconfig;
  const blockInit = blockly.Blocks[opcode].init;
  try {
    blockInit.call({
      jsonInit(config: BlockJSONconfig) {
        blockConfig = config;
      },
    });
  } catch (e) {
    return { text: opcode, color: FALLBACK_COLOR };
  }

  if (!blockConfig!) {
    return { text: opcode, color: FALLBACK_COLOR };
  }
  if (!("message0" in blockConfig)) {
    return { text: opcode, color: FALLBACK_COLOR };
  }
  const rawMessage = blockConfig["message0"];
  const args0 = blockConfig["args0"] || [];
  const processedMessage = rawMessage.replace(/%(\d+)/g, (match, idxStr) => {
    const arg = args0[Number(idxStr) - 1];
    if (!arg) return "";
    switch (arg.type) {
      case "field_label":
        return arg.text || "";
      case "field_image":
        return arg.alt || "";
      case "field_vertical_separator":
        return "";
      case "input_value":
      case "input_statement":
      case "input_statement_row":
      case "field_dropdown":
      case "field_number":
      case "field_variable":
      case "field_colour":
      case "field_checkbox":
      case "field_angle":
      case "field_date":
      case "field_matrix":
      case "field_note":
      default:
        return "()";
    }
  });
  return {
    text: processedMessage.replace(/\s+/g, " ").trim(),
    color: getBlockColor(blockConfig, blockly),
  };
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
