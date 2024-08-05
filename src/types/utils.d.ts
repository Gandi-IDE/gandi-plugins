/**
 * Interface for costume data.
 */
interface CostumeData {
  // Bitmap or data of the costume.
  bitmap: ArrayBufferLike | string;
  // Whether the costume is a vector image.
  isVector?: boolean;
  // X coordinate of the rotation center of paint editor.
  rotationCenterX: number;
  // Y coordinate of the rotation center of paint editor.
  rotationCenterY: number;
  // Width of the costume.
  width: number;
  // Height of the costume.
  height: number;
  // Unique identifier of the costume (optional).
  costumeId?: string;
  // he index of the costume (optional).
  costumeIndex?: number;
}

/**
 * Interface for sound data.
 */
interface SoundData {
  // The ID of the sound (optional).
  soundId?: string;
  // The index of the sound (optional).
  soundIndex?: number;
  // The encoding of the sound as an ArrayBuffer.
  soundEncoding: ArrayBuffer;
}

/**
 * Interface for action menu item.
 */
interface ActionMenuItem {
  id: string;
  img: string;
  title: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  fileAccept?: string;
  fileMultiple?: boolean;
  fileChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInput?: React.RefObject<HTMLInputElement>;
}

/**
 * Interface for context menu item.
 */
interface ContextMenuItem {
  key: string;
  text: string;
  border?: boolean;
  dangerous?: boolean;
  handleCallback: (e: React.MouseEvent<HTMLDivElement>, id: string) => void;
}

/**
 * Interface for extension information.
 */
interface ExtensionInfo {
  name: string;
  extensionId: string;
  collaborator?: string;
  connectingMessage?: string;
  connectionIconURL?: string;
  connectionSmallIconURL?: string;
  collaboratorList?: Array<{
    collaborator: string;
    collaboratorURL?: string;
  }>;
  collaboratorURL?: string;
  disabled?: boolean;
  doc?: string;
  featured: boolean;
  iconURL?: string;
  insetIconURL?: string;
}

/**
 * Utility methods for plugins.
 */
declare interface PluginsUtils {
  /**
   * Adds a costume to the specified target.
   * If targetId is not provided, operates on the currently selected sprite.
   * @param buffer - Costume data, can be an ArrayBuffer or a string.
   * @param fileName - Costume file name.
   * @param fileType - Costume file type.
   * @param targetId - ID of the target sprite (optional).
   * @returns void
   */
  addCostumeToTarget: (buffer: ArrayBuffer | string, fileName: string, fileType: string, targetId?: string) => void;

  /**
   * Deletes the specified costume by costumeIndex from the target sprite.
   * If targetId is not provided, operates on the currently selected sprite.
   * @param costumeIndex - Costume index.
   * @param targetId - ID of the target sprite (optional).
   * @returns void
   */
  deleteCostumeByTargetId: (costumeIndex: number, targetId?: string) => void;

  /**
   * Retrieves the costume at the specified index from the target sprite.
   * If targetId is not provided, operates on the currently selected sprite.
   * @param costumeIndex - Costume index.
   * @param targetId - ID of the target sprite (optional).
   * @returns void
   */
  getCostumeFromTarget: (costumeIndex: number, targetId?: string) => string | null;

  /**
   * Updates the costume of the specified target.
   * @param costumeData - Costume data.
   * @param targetId - Unique identifier of the target (optional).
   * @returns void
   */
  updateCostumeByTargetId: (costumeData: CostumeData, targetId?: string) => void;

  /**
   * Adds a sound to the specified target.
   * If targetId is not provided, operates on the currently selected sprite.
   * @param buffer - Sound data, can be an ArrayBuffer or a string.
   * @param fileName - Sound file name.
   * @param fileType - Sound file type.
   * @param targetId - ID of the target sprite (optional).
   * @returns void
   */
  addSoundToTarget: (buffer: ArrayBuffer | string, fileName: string, fileType: string, targetId?: string) => void;

  /**
   * Deletes the specified sound by soundIndex from the target sprite.
   * If targetId is not provided, operates on the currently selected sprite.
   * @param soundIndex - Sound index.
   * @param targetId - ID of the target sprite (optional).
   * @returns void
   */
  deleteSoundFromTarget: (soundIndex: number, targetId?: string) => void;

  /**
   * Retrieves the sound at the specified index from the target sprite.
   * If targetId is not provided, operates on the currently selected sprite.
   * @param soundIndex - Sound index.
   * @param targetId - ID of the target sprite (optional).
   * @returns void
   */
  getSoundFromTarget: (soundIndex: number, targetId?: string) => void;

  /**
   * Updates the sound buffer for a specific target.
   * @param soundData - The sound data to update.
   * @param targetId - The ID of the target (optional).
   * @returns void
   */
  updateSoundBufferByTargetId: (soundData: SoundData, targetId?: string) => void;

  /**
   * Expands the target menu items.
   * @param items - Array of action menu items to add.
   * @returns void
   */
  expandTargetMenuItems: (items: Array<ActionMenuItem>) => void;

  /**
   * Expands the costume menu items.
   * @param items - Array of action menu items to add.
   * @returns void
   */
  expandCostumeMenuItems: (items: Array<ActionMenuItem>) => void;

  /**
   * Expands the sound menu items.
   * @param items - Array of action menu items to add.
   * @returns void
   */
  expandSoundMenuItems: (items: Array<ActionMenuItem>) => void;

  /**
   * Removes target menu items.
   * @param itemIdList - Array of item IDs to remove.
   * @returns void
   */
  removeTargetMenuItems: (itemIdList: Array<string>) => void;

  /**
   * Removes costume menu items.
   * @param itemIdList - Array of item IDs to remove.
   * @returns void
   */
  removeCostumeMenuItems: (itemIdList: Array<string>) => void;

  /**
   * Removes sound menu items.
   * @param itemIdList - Array of item IDs to remove.
   * @returns void
   */
  removeSoundMenuItems: (itemIdList: Array<string>) => void;

  /**
   * Expands options of the target context menu.
   * @param items - Array of context menu items to add.
   * @returns void
   */
  expandTargetContextMenuItems: (items: Array<ContextMenuItem>) => void;

  /**
   * Expands options of the costume context menu.
   * @param items - Array of context menu items to add.
   * @returns void
   */
  expandCostumeContextMenuItems: (items: Array<ContextMenuItem>) => void;

  /**
   * Expands options of the sound context menu.
   * @param items - Array of context menu items to add.
   * @returns void
   */
  expandSoundContextMenuItems: (items: Array<ContextMenuItem>) => void;

  /**
   * Removes options from the target context menu.
   * @param itemKeyList - Array of item keys to remove.
   * @returns void
   */
  removeTargetContextMenuItems: (itemKeyList: Array<string>) => void;

  /**
   * Removes options from the costume context menu.
   * @param itemKeyList - Array of item keys to remove.
   * @returns void
   */
  removeCostumeContextMenuItems: (itemKeyList: Array<string>) => void;

  /**
   * Removes options from the sound context menu.
   * @param itemKeyList - Array of item keys to remove.
   * @returns void
   */
  removeSoundContextMenuItems: (itemKeyList: Array<string>) => void;

  /**
   * Retrieves all extension information, both built-in and external (official and custom).
   * @returns An object containing all extension information keyed by their extension IDs.
   */
  getAllExtensionInfo: () => Record<string, ExtensionInfo>;
}
