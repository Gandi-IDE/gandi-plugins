<div align="center">

  <h1>Gandi Plugins</h1>

  Gandi Plugins is a component library containing a suite of feature-enhancing plugins for Gandi-IDE.

  English · [中文](./README-zh_CN.md)
</div>

## 🤝 Contributing

  This project uses [pnpm](https://pnpm.io/) as the package manager. If you don't have [pnpm](https://pnpm.io/) installed globally on your device, please refer to the [pnpm installation guide](https://pnpm.io/installation#using-npm).

  ### 🖥 Local Environment Requirements

  1. We recommend using [VSCode](https://code.visualstudio.com/) for development.
  2. This project uses [pnpm](https://pnpm.io/) as the package manager. If you do not have [pnpm](https://pnpm.io) installed globally on your device, please refer to the [pnpm installation guide](https://pnpm.io/installation#using-npm)。
  3. This project requires Node.js version 16.14 or higher.

  ### 📦 Install Dependencies

  ```console
  $ pnpm install
  ```

  ### ⌨️ Start the Project

  After running the command below, access http://localhost:8081/ in your browser.
  ```console
  $ pnpm start
  ```

  ### 🖊️ Create a New Plugin

  The project supports quickly creating plugins using the createPlugin command.
  ```console
  $ pnpm createPlugin
  ```
  - `Please enter the plugin name (aaa-bbb)`: Plugin names only support spinal-case naming convention.
  - `Please select the implementation method of the plugin`: Support creating React component and regular function types of plugins. TypeScript is also supported.
  - `Please enter the plugin description`: You can briefly describe the functionality of this plugin here, and you can also modify it later in the `/src/plugins/your-plugin-name/`manifest file.
  - `Please enter the author's name of the plugin`: You can use the format of adding a clickable link after the name, for example, ccw(https://ccw.site); If you want to set multiple people, you can use commas to separate.

  ### 📖 PluginContext

  Each plug-in is passed an api object when it is created, which contains the following properties:

  ```typescript
  /**
   * Plugin context interface used to define the context information for plugins.
  */
  interface PluginContext {
    workspace: Blockly.WorkspaceSvg;
    vm: VirtualMachine;
    blockly: any;
    intl: IntlShape;
    trackEvents: TrackEvents;
    registerSettings: PluginRegister;
    msg: msg: (id: string) => string;
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
       * @param {string} [costumeData.costumeId] - Unique identifier of the costume (optional).
       * @param {number} [costumeData.costumeIndex] - The index of the costume (optional).
       * @param {ArrayBufferLike | string} costumeData.bitmap - Bitmap or data of the costume.
       * @param {boolean} costumeData.isVector - Whether the costume is a vector image.
       * @param {number} costumeData.rotationCenterX - X coordinate of the rotation center of the costume.
       * @param {number} costumeData.rotationCenterY - Y coordinate of the rotation center of the costume.
       * @param {number} costumeData.width - Width of the costume.
       * @param {number} costumeData.height - Height of the costume.
       * @param {string} [targetId] - Unique identifier of the target (optional).
       * @returns {void}
       */
      updateCostumeByTargetId: (
        costumeData: {
          isVector?: boolean,
          costumeId?: string;
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
       * @param {Object} soundData - Object containing sound data.
       * @param {string} [soundData.soundId] - The ID of the sound.
       * @param {number} [soundData.soundIndex] - The index of the sound.
       * @param {AudioBuffer} soundData.newBuffer - The new sound buffer.
       * @param {ArrayBuffer} soundData.soundEncoding - The encoding of the sound.
       * @param {string} [targetId] - The ID of the target sprite (optional).
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

      /**
       * Expands the menu items at the bottom "+" icon in the target list.
       * @param {Array<ActionMenuItem>} items - Menu items to be inserted.
       * @returns {void}
       */
      expandTargetMenuItems(items: Array<ActionMenuItem>): void;

      /**
       * Expands the menu items at the bottom "+" icon in the costume list.
       * @param {Array<ActionMenuItem>} items - Menu items to be inserted.
       * @returns {void}
       */
      expandCostumeMenuItems(items: Array<ActionMenuItem>): void;

      /**
       * Expands the menu items at the bottom "+" icon in the sound list.
       * @param {Array<ActionMenuItem>} items - Menu items to be inserted.
       * @returns {void}
       */
      expandSoundMenuItems(items: Array<ActionMenuItem>): void;

      /**
       * Removes certain menu items at the bottom "+" icon in the target list.
       * @param {Array<string>} itemIdList - Array of IDs of menu items to be removed.
       * @returns {void}
       */
      removeTargetMenuItems(itemIdList: Array<string>): void;

      /**
       * Removes certain menu items at the bottom "+" icon in the costume list.
       * @param {Array<string>} itemIdList - Array of IDs of menu items to be removed.
       * @returns {void}
       */
      removeCostumeMenuItems(itemIdList: Array<string>): void;

      /**
       * Removes certain menu items at the bottom "+" icon in the sound list.
       * @param {Array<string>} itemIdList - Array of IDs of menu items to be removed.
       * @returns {void}
       */
      removeSoundMenuItems(itemIdList: Array<string>): void;

      /**
       * Expands the menu items when right-clicking on a target.
       * @param {Array<ActionMenuItem>} items - Menu items to be inserted.
       * @returns {void}
       */
      expandTargetContextMenuItems(items: Array<ContextMenuItem>): void;

      /**
       * Expands the menu items when right-clicking on a costume.
       * @param {Array<ActionMenuItem>} items - Menu items to be inserted.
       * @returns {void}
       */
      expandCostumeContextMenuItems(items: Array<ContextMenuItem>): void;

      /**
       * Expands the menu items when right-clicking on a sound.
       * @param {Array<ActionMenuItem>} items - Menu items to be inserted.
       * @returns {void}
       */
      expandSoundContextMenuItems(items: Array<ContextMenuItem>): void;

      /**
       * Removes certain menu items when right-clicking on a target.
       * @param {Array<string>} itemIdList - Array of IDs of menu items to be removed.
       * @returns {void}
       */
      removeTargetContextMenuItems(itemKeyList: Array<string>): void;

      /**
       * Removes certain menu items when right-clicking on a costume.
       * @param {Array<string>} itemIdList - Array of IDs of menu items to be removed.
       * @returns {void}
       */
      removeCostumeContextMenuItems(itemKeyList: Array<string>): void;

      /**
       * Removes certain menu items when right-clicking on a sound.
       * @param {Array<string>} itemIdList - Array of IDs of menu items to be removed.
       * @returns {void}
       */
      removeSoundContextMenuItems(itemKeyList: Array<string>): void;
    };
  }
  ```
  ### 🧐 F&Q

  Here are frequently asked questions about Gandi Plugins that you should check out before asking the community or creating new questions.

  1. How to achieve good internationalization?
    There is a `msg` method on the PluginContext. Define the key under `src/l10n`, and then pass this key to the `msg` method where you use it.

  ```console
    msg('general.blocks.anticlockwise');
  ```

  2. How to register a menu in the code area?
    Use the following method to add options to the code area menu. The `targetNames` in the config specify the objects for which you want your menu options to be displayed.

  ```javascript
    /**
     * The callback function called before the menu is displayed if conditions are met.
    * callback: (items: Record<string, unknown>[], target: Record<string, unknown>, event: MouseEvent) => void;
    * The configuration options for the insertion condition.
    * config: {targetNames: Array<"workspace" | "blocks" | "frame" | "comment" | "toolbox">;}
    */
    const menuItemId = window.Blockly.ContextMenu.addDynamicMenuItem(callback, config);
    window.Blockly.ContextMenu.deleteDynamicMenuItem(menuItemId);
  ```
  3. How to add configuration options to your plugin in the settings?
  There is a `registerSettings` method on the PluginContext that can be used to register your configuration options.

  ```javascript
    const register = registerSettings(
      // This is the name of the plugin, which needs to support internationalization.
      msg("plugins.testPlugin.title"),
      [
        {
          // This is the key for each group of configurations.
          key: "popup",
          // This is the name of this group of keys.
          label: msg("plugins.testPlugin.popupConfig"),
          items: [
            {
              // This is the key for each configuration.
              key: "width",
              // This is the name of this configuration.
              label: msg("plugins.testPlugin.popupWidth"),
              // This is the type of this configuration, supporting "switch" | "input" | "select" | "hotkey".
              type: "input",
              // This is the default value of this configuration.
              value: '100',
              // Callback function when this configuration changes.
              onChange: (value) => {
                console.log("value", value);
              },
            },
          ],
        },
      ],
      // This is an icon for the plugin, which can be a React component or an img link.
      iconComponentOrIconLink,
    );
  ```
  4. How to write various styles?
    - Familiarize yourself with Gandi's theme styles, all of which are in [CSS variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) under :root. When setting colors, use these variables to ensure consistency with Gandi's style.
    - If you don't know how to write CSS yet, you can learn it [here](https://developer.mozilla.org/en-US/docs/Web/CSS).
    - The project uses [Less](https://lesscss.org/), which can help you write and organize CSS code more efficiently.

  5. How to Interact with GUI Redux?
      There is a redux object on PluginContext, and you can access the entire state of redux through redux.state. If you want to listen for changes in a certain state, you can achieve this by using `redux.addEventListener('statechanged', callback)`.

  ```javascript
    const vm = redux.state.scratchGui.vm;

    redux.addEventListener('statechanged', ({detail: {action, prev, next}}) => {});
  ```

## Project Structure

```console
  ├──plugin-template                 // Plugin template directory
  │   ├──plugin-index-js.hbs         // Handlebars template for JavaScript plugin index
  │   ├──plugin-index-react-js.hbs   // Handlebars template for React JavaScript plugin index
  │   ├──plugin-index-react-ts.hbs   // Handlebars template for React TypeScript plugin index
  │   ├──plugin-index-ts.hbs         // Handlebars template for TypeScript plugin index
  │   ├──plugin-manifest.hbs         // Handlebars template for plugin manifest
  │   └──styles.hbs                  // Handlebars template for plugin styles
  ├──src                             // Source directory
  │   ├──assets                      // Assets directory
  │   ├──components                  // React components directory
  │   │   ├──Bubble                  // Bubble component directory
  │   │   │   ├──index.tsx           // Bubble component implementation
  │   │   │   ├──styles.less         // Styles for Bubble component
  │   │   │   └──styles.less.d.ts    // Type definition for styles
  │   │   ├──ExpansionBox            // ExpansionBox component directory
  │   │   │   ├──index.tsx           // ExpansionBox component implementation
  │   │   │   ├──styles.less         // Styles for ExpansionBox component
  │   │   │   └──styles.less.d.ts    // Type definition for styles
  │   │   ├──IF                      // IF component directory
  │   │   │   └──index.tsx           // IF component implementation
  │   │   ├──Tab                     // Tab component directory
  │   │   │   ├──index.tsx           // Tab component implementation
  │   │   │   ├──styles.less         // Styles for Tab component
  │   │   │   └──styles.less.d.ts    // Type definition for styles
  │   │   └──Tooltip                 // Tooltip component directory
  │   │       ├──index.tsx           // Tooltip component implementation
  │   │       ├──styles.less         // Styles for Tooltip component
  │   │       └──styles.less.d.ts    // Type definition for styles
  │   ├──hooks                       // React hooks directory
  │   │   └──useStorageInfo.ts       // Custom hook for storage information
  │   ├──l10n                        // Internationalization directory
  │   │   ├──en.json                 // English language strings
  │   │   └──zh-cn.json              // Chinese (Simplified) language strings
  │   ├──lib                         // Library directory
  │   │   ├──block-media.ts          // Block media library
  │   │   ├──client-info.ts          // Client information library
  │   │   └──code-hash.json          // Code hash library
  │   ├──plugins                     // Plugins directory
  │   │   ├──code-batch-select       // Code batch select plugin directory
  │   │   ├──code-filter             // Code filter plugin directory
  │   │   ├──code-find               // Code find plugin directory
  │   │   ├──code-switch             // Code switch plugin directory
  │   │   ├──dev-tools               // Development tools plugin directory
  │   │   ├──jump-to-def             // Jump to definition plugin directory
  │   │   └──terminal                // Terminal plugin directory
  │   ├──types                       // Type definitions directory
  │   │   ├──blockly.d.ts            // Blockly type definitions
  │   │   ├──interface.d.ts          // Interface type definitions
  │   │   └──scratch.d.ts            // Scratch type definitions
  │   ├──utils                       // Utility functions directory
  │   │   ├──block-flasher.ts        // Block flasher utility
  │   │   ├──block-helper.ts         // Block helper utility
  │   │   ├──blocks-keywords-parser.ts // Blocks keywords parser utility
  │   │   ├──color.ts                // Color utility
  │   │   ├──dom-helper.ts           // DOM helper utility
  │   │   ├──hotkey-helper.ts        // Hotkey helper utility
  │   │   ├──index.ts                // Index utility
  │   │   ├──workspace-utils.ts      // Workspace utilities
  │   │   └──xml.ts                  // XML utility
  │   ├──index.tsx                   // Main entry point for React application
  │   ├──main.ts                     // Main entry point for TypeScript application
  │   ├──plugins-l10n.ts             // Plugins internationalization
  │   ├──plugins-controller.ts       // Plugins controller
  │   ├──plugins-entry.ts            // Plugins entry point
  │   ├──plugins-manifest.ts         // Plugins manifest
  │   └──types.d.ts                  // Global type definitions
  ├──.editorconfig                   // Editor configuration file
  ├──.eslintignore                   // ESLint ignore file
  ├──.eslintrc.json                  // ESLint configuration file
  ├──.gitignore                      // Git ignore file
  ├──.prettierrc                     // Prettier configuration file
  ├──LICENSE                         // License file
  ├──README-zh_CN.md                 // Readme file in Chinese
  ├──README.md                       // Readme file
  ├──favicon.ico                     // Favicon icon
  ├──index.html                      // HTML entry point
  ├──package.json                    // npm package file
  ├──plopfile.js                     // Plop configuration file
  ├──pnpm-lock.yaml                  // pnpm lock file
  ├──postcss.config.js               // PostCSS configuration file
  ├──tsconfig.json                   // TypeScript configuration file
  ├──webpack.config.js               // Webpack configuration file
  └──webpackDevServer.config.js      // Webpack Dev Server configuration file
```