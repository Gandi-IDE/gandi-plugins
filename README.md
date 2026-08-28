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
  3. This project requires Node.js version 18.12 or higher.

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
   vm: VirtualMachine;
    blockly: any;
    intl: IntlShape;
    trackEvents: TrackEvents;
    redux: PluginsRedux;
    utils: PluginsUtils;
    teamworkManager: [TeamworkManager](./src/types/teamwork.d.ts);
    workspace: Blockly.WorkspaceSvg;
    msg: (id: string) => string;
    registerSettings: PluginRegister;
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
      // The plugin ID should be named using the format plugin-aaa-bbb.
      "plugin-test-plugin",
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

Remote content and service URLs are supplied by the host. See [Host-provided plugin services](./docs/host-plugin-services.md) for the runtime contract, capability reporting, and CCW/Cocrea profiles.

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
  │   │   ├──better-sprite-menu      // Better sprite menu plugin directory
  │   │   ├──code-batch-select       // Code batch select plugin directory
  │   │   ├──code-filter             // Code filter plugin directory
  │   │   ├──code-find               // Code find plugin directory
  │   │   ├──code-switch             // Code switch plugin directory
  │   │   ├──custom-css              // Custom css plugin directory
  │   │   ├──custom-plugin           // Custom-plugin plugin directory
  │   │   ├──dev-tools               // Development tools plugin directory
  │   │   ├──dropdown-searchable     // Dropdown searchable plugin directory
  │   │   ├──extension-manager       // Extension manager plugin directory
  │   │   ├──fast-input              // Fast input plugin directory
  │   │   ├──folder                  // Folder version plugin directory
  │   │   ├──historical-version      // Historical version plugin directory
  │   │   ├──inspiro                 // Inspiro plugin directory
  │   │   ├──kukemc-beautify         // Kukemc beautify plugin directory
  │   │   ├──plugins-manager         // Plugins manager plugin directory
  │   │   ├──statistics              // Statistics plugin directory
  │   │   ├──terminal                // Terminal plugin directory
  │   │   └──witcat-blockinput       // Witcat blockinput plugin directory
  │   ├──types                       // Type definitions directory
  │   │   ├──blockly.d.ts            // Blockly type definitions
  │   │   ├──teamwork.d.ts           // Type definitions related to the collaboration API
  │   │   ├──interface.d.ts          // Interface type definitions
  │   │   ├──scratch.d.ts            // Scratch type definitions
  │   │   └──utils.d.ts              // Utility methods for plugins
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
