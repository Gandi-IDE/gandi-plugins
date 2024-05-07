import type { IntlShape } from "react-intl";
import type { CSSProperties, ReactNode, ReactElement } from "react";

interface Action<T = any> {
  type: T;
}

interface AnyAction extends Action {
  // Allows any extra properties to be defined in an action.
  [extraProps: string]: any;
}

interface Dispatch<A extends Action = AnyAction> {
  <T extends A>(action: T): T;
}

type PluginSettingValueType = string | number | string[] | number[] | boolean;

interface SettingOption {
  key?: string;
  label: string;
  value?: PluginSettingValueType;
}

interface SettingCategory {
  key: string;
  label: string;
  description?: ReactNode;
  items: Array<PluginSetting>;
}

interface ActionMenuItem {
  id: string;
  img: string;
  title: string;
  onClick: (e: React.MouseEventHandler<HTMLButtonElement>) => void;
  fileAccept?: string;
  fileMultiple?: boolean;
  fileChange?: (e: React.ChangeEventHandler<HTMLInputElement>) => void;
  fileInput?: React.LegacyRef<HTMLInputElement>;
}

interface ContextMenuItem {
  key: string;
  text: string;
  border?: boolean;
  dangerous?: boolean;
  handleCallback: (e: React.MouseEventHandler<HTMLDivElement>, id: string) => void;
}

interface VMAsset {
  name: null | string;
  dataFormat: string;
  asset: unknown;
  md5: string;
  assetId: string;
}

interface PluginsRedux extends EventTarget {
  state: Record<string, unknown>;
  dispatch: Dispatch<AnyAction>;
}

declare global {
  /**
   * Plugin context interface used to define the context information for plugins.
   */
  interface PluginContext {
    workspace: Blockly.WorkspaceSvg;
    vm: VirtualMachine;
    blockly: any;
    intl: IntlShape;
    trackEvents: TrackEvents;
    redux: PluginsRedux;
    utils: {
      /**
       * Adds a costume to the specified target.
       * If targetId is not provided, operates on the currently selected sprite.
       * @param {ArrayBuffer | string} buffer - Costume data, can be an ArrayBuffer or a string.
       * @param {string} fileName - Costume file name.
       * @param {string} fileType - Costume file type.
       * @param {string} [targetId] - ID of the target sprite (optional).
       * @returns {void}
       */
      addCostumeToTarget: (buffer: ArrayBuffer | string, fileName: string, fileType: string, targetId?: string) => void;
      /**
       * Deletes the specified costume by costumeIndex from the target sprite.
       * If targetId is not provided, operates on the currently selected sprite.
       * @param {number} costumeIndex - Costume index.
       * @param {string} [targetId] - ID of the target sprite (optional).
       * @returns {void}
       */
      deleteCostumeByTargetId: (costumeIndex: number, targetId?: string) => void;
      /**
       * Retrieves the costume at the specified index from the target sprite.
       * If targetId is not provided, operates on the currently selected sprite.
       * @param {number} costumeIndex - Costume index.
       * @param {string} [targetId] - ID of the target sprite (optional).
       * @returns {void}
       */
      getCostumeFromTarget: (costumeIndex: number, targetId?: string) => void;
      /**
       * Update the costume of the specified target.
       * @param {object} costumeData - Costume data.
       * @param {ArrayBufferLike | string} costumeData.bitmap - Bitmap or data of the costume.
       * @param {boolean} costumeData.isVector - Whether the costume is a vector image.
       * @param {number} costumeData.rotationCenterX - X coordinate of the rotation center of the costume.
       * @param {number} costumeData.rotationCenterY - Y coordinate of the rotation center of the costume.
       * @param {number} costumeData.width - Width of the costume.
       * @param {number} costumeData.height - Height of the costume.
       * @param {string} [costumeData.costumeId] - Unique identifier of the costume (optional).
       * @param {number} [costumeData.costumeIndex] - The index of the costume (optional).
       * @param {string} [targetId] - Unique identifier of the target (optional).
       * @returns {void}
       */
      updateCostumeByTargetId: (
        costumeData: {
          costumeId?: string;
          costumeIndex?: number;
          isVector?: boolean;
          bitmap: ArrayBufferLike | string;
          rotationCenterX: number;
          rotationCenterY: number;
          width: number;
          height: number;
        },
        targetId?: string,
      ) => void;
      /**
       * Adds a sound to the specified target.
       * If targetId is not provided, operates on the currently selected sprite.
       * @param {ArrayBuffer | string} buffer - Sound data, can be an ArrayBuffer or a string.
       * @param {string} fileName - Sound file name.
       * @param {string} fileType - Sound file type.
       * @param {string} [targetId] - ID of the target sprite (optional).
       * @returns {void}
       */
      addSoundToTarget: (buffer: ArrayBuffer | string, fileName: string, fileType: string, targetId?: string) => void;
      /**
       * Deletes the specified sound by soundIndex from the target sprite.
       * If targetId is not provided, operates on the currently selected sprite.
       * @param {number} soundIndex - Sound index.
       * @param {string} [targetId] - ID of the target sprite (optional).
       * @returns {void}
       */
      deleteSoundFromTarget: (soundIndex: number, targetId?: string) => void;
      /**
       * Retrieves the sound at the specified index from the target sprite.
       * If targetId is not provided, operates on the currently selected sprite.
       * @param {number} soundIndex - Sound index.
       * @param {string} [targetId] - ID of the target sprite (optional).
       * @returns {void}
       */
      getSoundFromTarget: (soundIndex: number, targetId?: string) => void;
      /**
       * Updates the sound buffer of the target sprite specified by targetId.
       * If targetId is not provided, operates on the currently selected sprite.
       * @param {number} soundIndex - Sound index.
       * @param {ArrayBuffer} soundEncoding - Sound encoding.
       * @param {string} [targetId] - ID of the target sprite (optional).
       * @returns {void}
       */
      updateSoundBufferByTargetId: (
        soundData: {
          soundId?: string;
          soundIndex?: number;
          soundEncoding: ArrayBuffer;
        },
        targetId?: string,
      ) => void;
      // Expands the target menu items.
      expandTargetMenuItems(items: Array<ActionMenuItem>): void;
      // Expands the costume menu items.
      expandCostumeMenuItems(items: Array<ActionMenuItem>): void;
      // Expands the sound menu items.
      expandSoundMenuItems(items: Array<ActionMenuItem>): void;
      // Removes target menu items.
      removeTargetMenuItems(itemIdList: Array<string>): void;
      // Removes costume menu items.
      removeCostumeMenuItems(itemIdList: Array<string>): void;
      // Removes sound menu items.
      removeSoundMenuItems(itemIdList: Array<string>): void;
      // Expands options of the target context menu.
      expandTargetContextMenuItems(items: Array<ContextMenuItem>): void;
      // Expands options of the costume context menu.
      expandCostumeContextMenuItems(items: Array<ContextMenuItem>): void;
      // Expands options of the sound context menu.
      expandSoundContextMenuItems(items: Array<ContextMenuItem>): void;
      // Removes options from the target context menu.
      removeTargetContextMenuItems(itemKeyList: Array<string>): void;
      // Removes options from the costume context menu.
      removeCostumeContextMenuItems(itemKeyList: Array<string>): void;
      // Removes options from the sound context menu.
      removeSoundContextMenuItems(itemKeyList: Array<string>): void;
    };
    msg: (id: string) => string;
    registerSettings: PluginRegister;
  }

  interface PluginSetting {
    type: "input" | "select" | "switch" | "hotkey" | "checkBoxGroup";
    disabled?: boolean;
    inputProps?: {
      type?: string;
      placeholder?: string;
      onInput?: (event: React.FormEventHandler<HTMLInputElement>) => void;
      onPressEnter?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
      onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
      onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
    };
    description?: string;
    key: string;
    label?: string;
    value: PluginSettingValueType;
    tags?: Array<{ text: string; link?: string }>;
    autoSave?: boolean;
    style?: CSSProperties;
    options?: Array<SettingOption>;
    onChange?: (value: PluginSettingValueType, cancelChange?: () => void) => void;
  }

  interface PluginRegister {
    (
      pluginName: string,
      id: string,
      settings: Array<SettingCategory>,
      icon?: string | ReactElement,
    ): {
      dispose(): void;
    };
  }

  interface TrackEvents {
    ANNOUNCEMENT_MODAL_SHOW: "ANNOUNCEMENT_MODAL_SHOW";
    ANNOUNCEMENT_MODAL_SHOW_TIME: "ANNOUNCEMENT_MODAL_SHOW_TIME";
    BLUEPRINTS_VIEWED: "BLUEPRINTS_VIEWED";
    BLUEPRINTS_USED: "BLUEPRINTS_USED";
    CLICK_ANNOUNCEMENT_CHANGE_LOG: "CLICK_ANNOUNCEMENT_CHANGE_LOG";
    CLICK_INSTALL_EXTENSION_BUTTON: "CLICK_INSTALL_EXTENSION_BUTTON";
    FIRST_USE_GANDI: "FIRST_USE_GANDI";
    LOADING_COMPLETE: "LOADING_COMPLETE";
    USE_APPLICATION: "USE_APPLICATION";
    USE_ADDON: "USE_ADDON";
    UPLOAD_BACKPACK_ITEMS: "UPLOAD_BACKPACK_ITEMS";
    USING_ADDON_HEARTBEAT: "USING_ADDON_HEARTBEAT";
    ENTER_GANDI: "USING_ADDON_HEARTBEAT";
    handler: () => void;
    updateHandler: (newHandler: () => void) => void;
    dispatch: (actionName: string, params: Record<string, unknown>) => void;
    heartbeatEvents: (
      actionName: string,
      params: Record<string, unknown>,
      delay?: string,
    ) => {
      dispose: () => void;
    };
  }
}
