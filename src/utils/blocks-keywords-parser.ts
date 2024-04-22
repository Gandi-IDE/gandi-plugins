import { bindAll } from "lodash-es";
import scratchblocks from "gandiblocks";
import { darken, hexToRgb, rgbArrayToHex } from "./color";

const extensions: Record<string, ExtensionInfo> = {};

const makeColour = (color: string, alpha: number) => {
  return rgbArrayToHex(darken(hexToRgb(color), alpha));
};

const verifyExtensionName = (extension = "") => {
  return extension.replace(/[.]/g, "");
};

const blocksEscape = function (unsafe: string | number): string {
  if (typeof unsafe === "number") {
    return String(unsafe);
  }
  // 在scratchblocks中，[]()<>/ 这些字符都是有意义的
  // eslint-disable-next-line no-useless-escape
  return String(unsafe.replace(/[\<\>\(\)\[\]\/]/g, (c) => `\\${c}`));
};

const isUselessElement = (element: { type: string; name: string }) => {
  const { type, name } = element;
  return (
    type === "field_image" ||
    type === "field_vertical_separator" ||
    (type === "input_statement" && name === "SUBSTACK") ||
    (type === "input_statement" && name === "SUBSTACK2")
  );
};

const addOutputTag = (info: { outputShape?: string; extension: ExtensionInfo }, content: string) => {
  const extensionName = verifyExtensionName(info.extension.key);
  let category = extensionName;
  switch (category) {
    case "data":
      category = "variables";
      break;
    case "data-lists":
      category = "list";
      break;
    default:
      break;
  }

  if (category) {
    if (info.outputShape === "boolean") {
      return `<${content}:: ${category}>`;
    } else if (info.outputShape === "reporter") {
      return `(${content}:: ${category})`;
    } else if (info.outputShape === "hat") {
      return `${content}:: ${category} hat`;
    } else if (info.outputShape === "end") {
      return `${content}:: ${category} cap`;
    } else if (info.outputShape === "stack" || info.outputShape === "command") {
      return `${content}:: ${category}`;
    }
  }

  return content;
};

const parseArguments = (code: string) =>
  code
    .split(/(?=[^\\]%[nbs])/g)
    .map((i) => i.trim())
    .filter((i) => i.charAt(0) === "%")
    .map((i) => i.substring(0, 2));

const appendExtension = (blockJson: BlockInitJson): [ExtensionInfo, string] => {
  const key = verifyExtensionName(blockJson.type.split("_")[0]);
  let extension: ExtensionInfo = null;
  if (extensions[key]) {
    extension = extensions[key];
  } else {
    extension = {
      key,
      iconUrl: blockJson.args0 ? blockJson.args0[0].src : "",
      colour: blockJson.colour,
    };
    scratchblocks.appendExtension({
      id: key,
      width: "40px",
      height: "40px",
      colour: blockJson.colour,
      colourSecondary: blockJson.colourSecondary || makeColour(blockJson.colour, 0.1),
      colourTertiary: blockJson.colourTertiary || makeColour(blockJson.colour, 0.2),
      href: extension.iconUrl,
    });
    extensions[key] = extension;
  }
  return [extension, key];
};

interface BlockInitJson {
  args0: Array<{
    name: string;
    options: Array<string> | (() => Array<string>);
    type: string;
    src?: string;
  }>;
  category: string;
  colour?: string;
  colourSecondary?: string;
  colourTertiary?: string;
  extensions?: string[];
  nextStatement?: string | null;
  previousStatement?: string | null;
  id?: string;
  inputsInline?: boolean;
  output?: string;
  outputShape?: number;
  message0?: string;
  type?: string;
}

interface ExtensionInfo {
  iconUrl: string;
  colour: string;
  key: string;
}

export default class BlocksKeywordsParser {
  blocks: Record<string, Scratch.BlockState>;
  blockDefinitions: Record<string, { init: () => void }>;

  workspace: Blockly.WorkspaceSvg;

  constructor(workspace: Blockly.WorkspaceSvg) {
    bindAll(this, ["interpolate", "processor", "parseBlock", "parseProceduresBlock", "parser"]);
    this.workspace = workspace;
    this.blockDefinitions = this.workspace.getScratchBlocksBlocks();
    this.blocks = {};
  }

  interpolate(message: string, args: string[]) {
    const tokens = window.Blockly.Utils.tokenizeInterpolation(message);
    // Interpolate the arguments.  Build a list of elements.
    let indexCount = 0;
    const indexDup = [];
    const elements = [];
    for (let i = 0; i < tokens.length; i++) {
      let token = tokens[i];
      if (typeof token === "number") {
        if (token <= 0 || token > args.length) {
          throw new Error(`Block: Message index %${token} out of range.`);
        }
        if (indexDup[token]) {
          throw new Error(`Block: Message index %${token} duplicated.`);
        }
        indexDup[token] = true;
        indexCount++;
        elements.push(args[token - 1]);
      } else {
        token = token.trim();
        if (token) {
          elements.push(token);
        }
      }
    }
    if (indexCount !== args.length) {
      throw new Error(`Block: Message does not reference all ${args.length} arg(s).`);
    }
    return elements;
  }

  getOutputShape(json: BlockInitJson) {
    if (json.outputShape === 1) {
      return "boolean";
    }
    if (json.outputShape === 2) {
      return "reporter";
    }
    if (json.extensions) {
      if (json.extensions.includes("output_number") || json.extensions.includes("output_string")) {
        return "reporter";
      }
      if (json.extensions.includes("output_boolean")) {
        return "boolean";
      }
      if (json.extensions.includes("shape_hat")) {
        return "hat";
      }
      if (json.extensions.includes("shape_statement")) {
        return "stack";
      }
      if (json.previousStatement === void 0) {
        return "hat";
      }
      if (json.nextStatement === void 0) {
        return "end";
      }
      return "stack";
    }
  }

  parseBlock(block: Scratch.BlockState) {
    let blockJson: BlockInitJson = null;
    if (this.blockDefinitions[block.opcode]) {
      this.blockDefinitions[block.opcode].init.call({
        jsonInit: (json: BlockInitJson) => (blockJson = json),
      });
      let extension: ExtensionInfo = null;
      if (blockJson.type && blockJson.extensions && blockJson.extensions[0] === "scratch_extension") {
        [extension] = appendExtension(blockJson);
      } else {
        let category = blockJson.category;
        if (block.opcode.startsWith("argument_reporter") || block.opcode === "ccw_hat_parameter") {
          category = "custom";
        }
        extension = {
          key: category,
          iconUrl: "",
          colour: "",
        };
      }
      if (blockJson) {
        const data = this.parser(block, blockJson);
        return { ...data, extension };
      }
    } else {
      console.warn("WARNING: init is undefined", block);
    }
  }

  parseProceduresBlock(block: Scratch.BlockState) {
    let script = block.mutation.proccode;
    let keywordText = script;
    const params = parseArguments(block.mutation.proccode);
    if (params.length) {
      if (block.mutation.argumentnames) {
        const argumentnames = JSON.parse(block.mutation.argumentnames);
        params.forEach((param, index) => {
          const argumentName = blocksEscape(argumentnames[index]);
          script = script.replace(param, param === "%b" ? `<${argumentName}>` : `(${argumentName})`);
          keywordText = keywordText.replace(param, argumentName);
        });
      } else {
        const argumentids = JSON.parse(block.mutation.argumentids);
        params.forEach((param, index) => {
          const inputBlock = block.inputs[argumentids[index]];
          if (inputBlock && inputBlock.block && this.blocks[inputBlock.block]) {
            const childBlock = this.blocks[inputBlock.block || inputBlock.shadow];
            const info = this.parseBlock(childBlock);
            const paramStrings = info.scriptTextRows[0];
            if (paramStrings) {
              const str = paramStrings.join(" ");
              keywordText = keywordText.replace(param, str);
              switch (param) {
                case "%b":
                  script = script.replace(param, `<${str}>`);
                  break;
                case "%s":
                  script = script.replace(param, this.blocks[childBlock.id].shadow ? str : addOutputTag(info, str));
                  break;
                default:
                  break;
              }
            } else {
              console.warn("There was an exception in block processing, the input block parse failed.");
            }
          } else {
            script = script.replace(param, param === "%b" ? "<>" : "()");
            keywordText = keywordText.replace(param, "");
          }
        });
      }
    }
    return [script, keywordText];
  }

  parseDynamicBlock(block: Scratch.BlockState) {
    let script = block.mutation.blockInfo.text || block.mutation.blockInfo.opcode;
    let keywordText = script;
    let blockJson: BlockInitJson = null;
    if (this.blockDefinitions[block.opcode]) {
      this.blockDefinitions[block.opcode].init.call({
        jsonInit: (json: BlockInitJson) => (blockJson = json),
      });
      if (blockJson) {
        const [, key] = appendExtension(blockJson);
        const params = script.split(/(\[\w+\])/g);
        params.forEach((param) => {
          if (param.startsWith("[")) {
            const key = param.slice(1, -1);
            const inputBlock = block.inputs[key];
            if (inputBlock && inputBlock.block && this.blocks[inputBlock.block]) {
              const blockId = inputBlock.block;
              const info = this.parseBlock(this.blocks[blockId]);
              const paramStrings = info.scriptTextRows[0];
              if (paramStrings) {
                const str = paramStrings.join(" ");
                keywordText = keywordText.replace(param, str);
                script = script.replace(param, str);
              } else {
                console.warn("There was an exception in block processing, the input block parse failed.");
              }
            }
          } else {
            script = script.replace(param, blocksEscape(param));
          }
        });
        script = addOutputTag(
          {
            outputShape: block.mutation.blockInfo.blockType.toLowerCase(),
            extension: {
              key: key,
              iconUrl: "",
              colour: "",
            },
          },
          script,
        );
        return [script, keywordText];
      }
    } else {
      console.warn("Parser dynamic block filed");
    }
  }

  parser(block: Scratch.BlockState, json: BlockInitJson) {
    const scriptTextRows = [];
    const keywordTextRows = [];
    const outputShape = this.getOutputShape(json);
    // Interpolate the message blocks.
    let i = 0;
    while (typeof json[`message${i}`] !== "undefined") {
      const elements = this.interpolate(json[`message${i}`], json[`args${i}`] || []);
      const isRounded = elements.length === 1;
      const stringElements = [];
      const optionStringElements = [];
      for (let j = 0; j < elements.length; j++) {
        const element = elements[j];
        if (typeof element === "string") {
          stringElements.push(blocksEscape(element));
          optionStringElements.push(element);
        } else if (typeof element === "object") {
          if (isUselessElement(element)) {
            continue;
          } else if (element.type === "field_dropdown" || element.type === "field_variable") {
            const value = block.fields[element.name]?.value;
            if (value) {
              let selectedOption = null;
              if (element.options) {
                const options = Array.isArray(element.options) ? element.options : element.options();
                // eslint-disable-next-line eqeqeq
                selectedOption = options.find((o: [string, string]) => o[1] == value);
              }
              if (selectedOption) {
                const text = selectedOption[0];
                stringElements.push(isRounded ? `(${blocksEscape(text)} v)` : `[${blocksEscape(text)} v]`);
                optionStringElements.push(text);
              } else {
                stringElements.push(isRounded ? `(${blocksEscape(value)} v)` : `[${blocksEscape(value)} v]`);
                optionStringElements.push(value);
              }
            } else {
              stringElements.push(isRounded ? `()` : `[]`);
            }
          } else if (element.type.startsWith("field_")) {
            const str = blocksEscape(block.fields[element.name].value);
            if (block.opcode === "ccw_hat_parameter") {
              stringElements.push(
                addOutputTag(
                  {
                    outputShape: "reporter",
                    extension: {
                      key: "custom",
                      iconUrl: "",
                      colour: "",
                    },
                  },
                  str,
                ),
              );
            } else if (block.shadow) {
              stringElements.push(`[${str}]`);
            } else {
              stringElements.push(str);
            }
            optionStringElements.push(str);
          } else if (
            element.type === "input_value" ||
            (element.type === "input_statement" && element.name === "SUBSTACK")
          ) {
            const input = block.inputs[element.name];
            if (input && input.block) {
              // 异常情况下 input.block 积木可能找不到
              const inlineBlock = this.blocks[input.block] || this.blocks[input.shadow];
              const childBlockId = inlineBlock.id;
              if (inlineBlock) {
                const info = this.parseBlock(inlineBlock);
                if (info && info.scriptTextRows[0]) {
                  let str = info.scriptTextRows[0].join(" ");
                  if (childBlockId !== input.shadow) {
                    str = addOutputTag(info, str);
                  }
                  stringElements.push(str);
                  optionStringElements.push(str);
                } else {
                  console.warn("There was an exception in block processing, the input block parse failed.");
                }
              } else {
                console.warn(
                  ` The block (ID: ${block.id}) failed to parse because its child block (ID: ${input.block}) does not exist.`,
                );
              }
            } else {
              stringElements.push(element.check === "Boolean" ? "<>" : "[]");
            }
          } else if (element.type === "input_statement" && element.name === "custom_block") {
            const input = block.inputs[element.name];
            const [script, keywordText] = this.parseProceduresBlock(this.blocks[input.block]);
            stringElements.push(script);
            optionStringElements.push(keywordText);
          } else {
            console.warn("Unknown element", block, json, element);
          }
        }
      }
      scriptTextRows.push(stringElements);
      keywordTextRows.push(optionStringElements);
      i++;
    }
    if (scriptTextRows.length === 0) {
      if (block.opcode === "procedures_call_with_return") {
        const [script, keywordText] = this.parseProceduresBlock(block);
        scriptTextRows.push([script]);
        keywordTextRows.push([keywordText]);
      }
    }
    return { scriptTextRows, keywordTextRows, outputShape };
  }

  processor(blocks: Record<string, Scratch.BlockState>) {
    this.blocks = blocks;
    const options: Array<[string, string, string]> = [];
    for (const key in this.blocks) {
      if (Object.hasOwnProperty.call(this.blocks, key)) {
        const block = this.blocks[key];
        const isShadow = block.shadow;
        const isNotParent = !block.parent;
        const isParentNextBlock = this.blocks[block.parent]?.next === block.id;
        const isParentSubstackBlock =
          this.blocks[block.parent]?.inputs.SUBSTACK?.block === block.id ||
          this.blocks[block.parent]?.inputs.SUBSTACK2?.block === block.id;

        if (block.opcode === "control_stop") {
          const script = this.workspace.parseControlStopBlock(block);
          options.push([block.id, script, script]);
        } else if (block.opcode === "procedures_call") {
          const [script, keywordText] = this.parseProceduresBlock(block);
          options.push([block.id, `${script}:: custom`, keywordText]);
        } else if (block.mutation && block.mutation.blockInfo) {
          const [script, keywordText] = this.parseDynamicBlock(block);
          options.push([block.id, script, keywordText]);
        } else if (!isShadow && (isNotParent || isParentNextBlock || isParentSubstackBlock)) {
          const info = this.parseBlock(block);

          if (!info || !info.scriptTextRows[0]) {
            console.warn("There was an exception in block processing");
            continue;
          }
          if (info.scriptTextRows.length > 1) {
            const script = info.scriptTextRows.reduce((acc, row, index) => {
              if (index === 0) {
                return addOutputTag(info, row.join(" "));
              }
              return `${acc} \n ${row.join(" ")}`;
            }, "");
            const keywordText = info.keywordTextRows.reduce((acc, row, index) => {
              if (index === 0) {
                return row.join(" ");
              }
              return `${acc} ${row.join(" ")}`;
            }, "");
            options.push([block.id, script, keywordText]);
          } else {
            const script = addOutputTag(info, info.scriptTextRows[0].join(" "));
            const keywordText = info.keywordTextRows[0].join(" ");
            options.push([block.id, script, keywordText]);
          }
        }
      }
    }
    return options;
  }
}
