import { compareUsedExtensionBlocks } from "./compatibility";
import {
  ExtensionBlockDefinition,
  ExtensionCompatibilityReport,
  ExtensionMetadata,
  ManagedCustomExtension,
  UsedExtensionBlock,
} from "./types";

type CustomExtensionInfo = Extension & {
  replaceable?: boolean;
  url?: string;
};

type ExternalExtensionInstance = {
  getInfo(): ExtensionMetadata | Promise<ExtensionMetadata>;
};

type ExternalExtensionConstructor = new (runtime: Scratch.Runtime) => ExternalExtensionInstance;

type VersionManagerExtensionManager = Scratch.ExtensionManager & {
  _customExtensionInfo: Record<string, CustomExtensionInfo>;
  getLoadedExtensionURLs(): Record<string, string>;
  registerExtension(extensionId: string, extension: unknown, shouldReplace?: boolean): string | undefined;
};

type RuntimeBlockCategory = {
  id: string;
  blocks?: Array<{
    info?: ExtensionBlockDefinition;
  }>;
};

type RuntimeWithBlockInfo = Scratch.Runtime & {
  _blockInfo?: RuntimeBlockCategory[];
};

const normalizeLoadResult = (result: unknown): string[] => {
  if (typeof result === "string") return [result];
  if (!Array.isArray(result)) return [];

  const flattened: string[] = [];
  const append = (items: unknown[]) => {
    items.forEach((item) => {
      if (typeof item === "string") {
        flattened.push(item);
      } else if (Array.isArray(item)) {
        append(item);
      }
    });
  };
  append(result);
  return flattened;
};

const createExtensionIdMismatchError = (extensionId: string, loadedIds: string[]) => {
  const error = new Error("EXTENSION_ID_MISMATCH") as Error & {
    expectedId?: string;
    loadedIds?: string[];
  };
  error.expectedId = extensionId;
  error.loadedIds = loadedIds;
  return error;
};

const getBlockLabel = (text: unknown, fallback: string) => {
  if (typeof text === "string" && text.trim()) return text.trim();
  if (text && typeof text === "object") {
    const descriptor = text as { default?: unknown; defaultMessage?: unknown; id?: unknown };
    if (typeof descriptor.default === "string" && descriptor.default.trim()) return descriptor.default.trim();
    if (typeof descriptor.defaultMessage === "string" && descriptor.defaultMessage.trim()) {
      return descriptor.defaultMessage.trim();
    }
    if (typeof descriptor.id === "string" && descriptor.id.trim()) return descriptor.id.trim();
  }
  return fallback;
};

const collectUsedExtensionBlocks = (vm: PluginContext["vm"], extensionId: string): UsedExtensionBlock[] => {
  const runtime = vm.runtime as RuntimeWithBlockInfo;
  const category = runtime._blockInfo?.find((item) => item.id === extensionId);
  const currentDefinitions = new Map<string, ExtensionBlockDefinition>();
  (category?.blocks || []).forEach((block) => {
    if (block.info?.opcode) currentDefinitions.set(block.info.opcode, block.info);
  });

  const prefix = `${extensionId}_`;
  const seen = new Set<string>();
  const usedBlocks: UsedExtensionBlock[] = [];

  runtime.targets.forEach((target) => {
    if (!target.isStage && !target.isOriginal) return;
    Object.values(target.blocks._blocks).forEach((block) => {
      if (!block.opcode.startsWith(prefix)) return;
      const key = `${target.id}:${block.id}`;
      if (seen.has(key)) return;
      seen.add(key);

      const opcode = block.opcode.slice(prefix.length);
      const mutationInfo = block.mutation?.blockInfo as ExtensionBlockDefinition | undefined;
      const currentDefinition = mutationInfo || currentDefinitions.get(opcode);
      usedBlocks.push({
        blockId: block.id,
        targetId: target.id,
        targetName: target.getName?.() || target.sprite?.name || target.id,
        opcode,
        label: getBlockLabel(currentDefinition?.text, opcode),
        blockType: currentDefinition?.blockType,
      });
    });
  });

  return usedBlocks;
};

const getExternalExtensionMetadata = async (
  manager: VersionManagerExtensionManager,
  vm: PluginContext["vm"],
  extensionId: string,
) => {
  const extension = (await manager.getExternalExtensionConstructor(extensionId)) as
    | ExternalExtensionConstructor
    | ExternalExtensionInstance;
  const instance =
    typeof extension === "function" ? new (extension as ExternalExtensionConstructor)(vm.runtime) : extension;
  if (!instance || typeof instance.getInfo !== "function") {
    throw new Error(`Extension ${extensionId} does not provide getInfo().`);
  }
  return Promise.resolve(instance.getInfo());
};

const restorePreviousLibraryEntry = async (
  manager: VersionManagerExtensionManager,
  extensionId: string,
  previousInfo: CustomExtensionInfo | undefined,
  previousUrl: string,
  previousExtension: unknown,
) => {
  const previousConstructor =
    typeof previousExtension === "function"
      ? previousExtension
      : previousExtension &&
          typeof previousExtension === "object" &&
          typeof (previousExtension as { constructor?: unknown }).constructor === "function"
        ? (previousExtension as { constructor: unknown }).constructor
        : undefined;

  if (previousInfo && previousConstructor) {
    manager.addCustomExtensionInfo(
      {
        ...previousInfo,
        Extension: previousConstructor,
      },
      previousUrl,
    );
  } else if (previousUrl) {
    await manager.loadExternalExtensionToLibrary(previousUrl, true, true);
  }

  if (previousInfo) manager._customExtensionInfo[extensionId] = previousInfo;
};

export const getLoadedCustomExtensions = (vm: PluginContext["vm"]): ManagedCustomExtension[] => {
  const manager = vm.extensionManager as VersionManagerExtensionManager;
  const loadedUrls = manager.getLoadedExtensionURLs?.() || {};
  const wildExtensions = vm.runtime.gandi?.wildExtensions || {};

  return Object.entries(manager._customExtensionInfo || {})
    .filter(([extensionId]) => manager.isExtensionLoaded(extensionId))
    .map(([extensionId, extension]) => ({
      id: extensionId,
      name: extension.info?.name || extensionId,
      currentUrl: wildExtensions[extensionId]?.url || loadedUrls[extensionId] || extension.url || "",
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const inspectCustomExtensionVersionCompatibility = async (
  vm: PluginContext["vm"],
  extensionId: string,
  url: string,
): Promise<ExtensionCompatibilityReport> => {
  const manager = vm.extensionManager as VersionManagerExtensionManager;
  const previousInfo = manager._customExtensionInfo[extensionId];
  const previousUrl = manager.getLoadedExtensionURLs?.()?.[extensionId] || previousInfo?.url || "";
  let previousExtension: unknown;

  try {
    previousExtension = await manager.getExternalExtensionConstructor(extensionId);
  } catch {
    previousExtension = undefined;
  }

  let targetMetadata: ExtensionMetadata;
  let loadedIds: string[] = [];
  try {
    const result = await manager.loadExternalExtensionToLibrary(url, true, true);
    loadedIds = Array.from(new Set([...(result.onlyAdded || []), ...(result.addedAndLoaded || [])]));
    if (!loadedIds.includes(extensionId)) throw createExtensionIdMismatchError(extensionId, loadedIds);

    targetMetadata = await getExternalExtensionMetadata(manager, vm, extensionId);
    if (targetMetadata.id !== extensionId) {
      throw createExtensionIdMismatchError(extensionId, targetMetadata.id ? [targetMetadata.id] : loadedIds);
    }
  } finally {
    await restorePreviousLibraryEntry(manager, extensionId, previousInfo, previousUrl, previousExtension);
  }

  const usedBlocks = collectUsedExtensionBlocks(vm, extensionId);
  return {
    extensionId,
    targetExtensionId: targetMetadata.id || extensionId,
    issues: compareUsedExtensionBlocks(usedBlocks, targetMetadata),
  };
};

const refreshWorkspace = (vm: PluginContext["vm"], workspace: PluginContext["workspace"]) => {
  setTimeout(() => {
    const flyout = workspace?.getFlyout?.();
    const previousRefreshState = workspace?.toolboxRefreshEnabled_;

    try {
      flyout?.setRecyclingEnabled?.(false);
      if (workspace) {
        workspace.toolboxRefreshEnabled_ = true;
        workspace.refreshToolboxSelection_?.();
        workspace.toolboxRefreshEnabled_ = previousRefreshState;
      }
    } finally {
      flyout?.setRecyclingEnabled?.(true);
    }

    vm.emitWorkspaceUpdate?.();
  }, 0);
};

const restorePreviousMetadata = async (
  manager: VersionManagerExtensionManager,
  extensionId: string,
  previousInfo: CustomExtensionInfo | undefined,
  previousUrl: string,
) => {
  if (previousUrl) {
    try {
      await manager.loadExternalExtensionToLibrary(previousUrl, true, true);
    } catch {
      // The running service remains the old one when replacement validation fails.
      // Restoring its cached constructor is best-effort; metadata is restored below.
    }
  }

  if (previousInfo) {
    manager._customExtensionInfo[extensionId] = previousInfo;
  }
  if (previousUrl) {
    manager.saveWildExtensionsURL(extensionId, previousUrl);
  }
};

const loadWithCompatibilityChecksBypassed = async (
  vm: PluginContext["vm"],
  manager: VersionManagerExtensionManager,
  extensionId: string,
  url: string,
) => {
  const originalRegisterExtension = manager.registerExtension;
  const patchedRegisterExtension: VersionManagerExtensionManager["registerExtension"] = (
    incomingExtensionId,
    extension,
    shouldReplace,
  ) => {
    if (incomingExtensionId !== extensionId || !shouldReplace || !manager.isExtensionLoaded(extensionId)) {
      return originalRegisterExtension.call(manager, incomingExtensionId, extension, shouldReplace);
    }

    const prefix = `${extensionId}_`;
    const snapshots: Array<{ block: Scratch.BlockState; opcode: string }> = [];
    vm.runtime.targets.forEach((target) => {
      Object.values(target.blocks._blocks).forEach((block) => {
        if (!block.opcode.startsWith(prefix)) return;
        snapshots.push({ block, opcode: block.opcode });
        block.opcode = `__custom_extension_version_manager__${block.opcode}`;
      });
    });

    try {
      return originalRegisterExtension.call(manager, incomingExtensionId, extension, shouldReplace);
    } finally {
      snapshots.forEach(({ block, opcode }) => {
        block.opcode = opcode;
      });
    }
  };

  manager.registerExtension = patchedRegisterExtension;
  try {
    return await manager.loadExtensionURL(url, true);
  } finally {
    if (manager.registerExtension === patchedRegisterExtension) {
      manager.registerExtension = originalRegisterExtension;
    }
  }
};

export const switchCustomExtensionVersion = async (
  vm: PluginContext["vm"],
  workspace: PluginContext["workspace"],
  extensionId: string,
  url: string,
  force = false,
) => {
  const manager = vm.extensionManager as VersionManagerExtensionManager;
  const previousInfo = manager._customExtensionInfo[extensionId];
  const previousUrl = manager.getLoadedExtensionURLs?.()?.[extensionId] || previousInfo?.url || "";
  const loadedBefore = new Set(manager._loadedExtensions.keys());

  try {
    const result = force
      ? await loadWithCompatibilityChecksBypassed(vm, manager, extensionId, url)
      : await manager.loadExtensionURL(url, true);
    const loadedIds = normalizeLoadResult(result);
    const newlyLoadedIds = Array.from(manager._loadedExtensions.keys()).filter((id) => !loadedBefore.has(id));
    const unexpectedIds = Array.from(new Set([...loadedIds, ...newlyLoadedIds])).filter(
      (id) => id !== extensionId && !loadedBefore.has(id),
    );

    unexpectedIds.forEach((id) => {
      if (manager.isExtensionLoaded(id)) {
        manager.deleteExtensionById(id);
      }
    });

    const currentInfo = manager.getExtensionInfoById(extensionId) as CustomExtensionInfo | undefined;
    const currentUrl = manager.getLoadedExtensionURLs?.()?.[extensionId] || currentInfo?.url || "";
    const loadedExpectedExtension = manager.isExtensionLoaded(extensionId);
    const resultMatches = loadedIds.length === 0 || loadedIds.includes(extensionId);

    if (!loadedExpectedExtension || !resultMatches || currentUrl !== url) {
      throw createExtensionIdMismatchError(extensionId, loadedIds);
    }

    manager.saveWildExtensionsURL(extensionId, url);
    vm.runtime.emitProjectChanged?.();
    vm.emit("DEV_EXTENSION_LOAD_SUCCESS", [extensionId]);
    refreshWorkspace(vm, workspace);

    return {
      extensionId,
      url,
    };
  } catch (error) {
    await restorePreviousMetadata(manager, extensionId, previousInfo, previousUrl);
    throw error;
  }
};
