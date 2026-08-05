export interface ExtensionVersion {
  id: string;
  label: string;
  url: string;
  releasedAt?: string | number;
  changelog?: string;
  releaseTags: string[];
}

export interface MarketplaceExtensionDetail {
  eid: string;
  name: string;
  versions: ExtensionVersion[];
}

export interface ManagedCustomExtension {
  id: string;
  name: string;
  currentUrl: string;
}

export interface ExtensionBlockDefinition {
  opcode?: string;
  blockType?: string;
  text?: unknown;
  hideFromPalette?: boolean;
  isDynamic?: boolean;
}

export interface ExtensionMetadata {
  id?: string;
  blocks?: Array<ExtensionBlockDefinition | string>;
}

export interface UsedExtensionBlock {
  blockId: string;
  targetId: string;
  targetName: string;
  opcode: string;
  label: string;
  blockType?: string;
}

export type BlockCompatibilityReason = "missing" | "hidden" | "blockTypeChanged";

export interface IncompatibleBlockUsage extends UsedExtensionBlock {
  reason: BlockCompatibilityReason;
  targetBlockType?: string;
}

export interface ExtensionCompatibilityReport {
  extensionId: string;
  targetExtensionId: string;
  issues: IncompatibleBlockUsage[];
}
