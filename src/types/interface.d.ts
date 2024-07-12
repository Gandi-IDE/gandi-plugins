import type { IntlShape } from "react-intl";
import type { CSSProperties, ReactElement, ReactNode } from "react";

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
    vm: VirtualMachine;
    blockly: any;
    intl: IntlShape;
    trackEvents: TrackEvents;
    redux: PluginsRedux;
    utils: PluginsUtils;
    teamworkManager: TeamworkManager;
    registerSettings: PluginRegister;
    workspace: Blockly.WorkspaceSvg;
    /**
     * A shortcut method to replace intl.formatMessage.
     *
     * @param descriptor - The message descriptor.
     * @returns The formatted message.
     */
    msg: (descriptor: string) => string;
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
    description?: ReactNode;
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
