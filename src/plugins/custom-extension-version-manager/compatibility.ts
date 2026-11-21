import { ExtensionBlockDefinition, ExtensionMetadata, IncompatibleBlockUsage, UsedExtensionBlock } from "./types";

const DEFAULT_BLOCK_TYPE = "command";

const getBlockDefinitions = (metadata: ExtensionMetadata): Map<string, ExtensionBlockDefinition> => {
  const definitions = new Map<string, ExtensionBlockDefinition>();
  (metadata.blocks || []).forEach((block) => {
    if (typeof block === "string" || !block.opcode) return;
    definitions.set(block.opcode, block);
  });
  return definitions;
};

const normalizeBlockType = (blockType: string | undefined) => blockType || DEFAULT_BLOCK_TYPE;

export const compareUsedExtensionBlocks = (
  usedBlocks: UsedExtensionBlock[],
  targetMetadata: ExtensionMetadata,
): IncompatibleBlockUsage[] => {
  const targetDefinitions = getBlockDefinitions(targetMetadata);

  return usedBlocks.reduce<IncompatibleBlockUsage[]>((issues, usedBlock) => {
    const targetDefinition = targetDefinitions.get(usedBlock.opcode);
    if (!targetDefinition) {
      issues.push({
        ...usedBlock,
        reason: "missing",
      });
      return issues;
    }

    if (targetDefinition.hideFromPalette) {
      issues.push({
        ...usedBlock,
        reason: "hidden",
        targetBlockType: normalizeBlockType(targetDefinition.blockType),
      });
      return issues;
    }

    if (
      usedBlock.blockType &&
      normalizeBlockType(usedBlock.blockType) !== normalizeBlockType(targetDefinition.blockType)
    ) {
      issues.push({
        ...usedBlock,
        reason: "blockTypeChanged",
        targetBlockType: normalizeBlockType(targetDefinition.blockType),
      });
    }
    return issues;
  }, []);
};
