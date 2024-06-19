<div align="center">

  <h1>Gandi Plugins</h1>

  Gandi plugins 是一个包含为了增强 Gandi-IDE 的功能插件的组件库。

  [English](./README.md) · 中文
</div>

## 🤝 参与共建

  本项目使用 [pnpm](https://pnpm.io/) 作为包管理工具。如果你的设备没有全局安装 [pnpm](https://pnpm.io), 请参考 [pnpm 安装教程](https://pnpm.io/zh/installation#%E4%BD%BF%E7%94%A8-npm-%E5%AE%89%E8%A3%85)。

  ### 🖥 本地环境要求

  1. 推荐使用 [VSCode](https://code.visualstudio.com/) 进行开发。
  2. 本项目使用 [pnpm](https://pnpm.io/) 作为包管理工具。如果你的设备没有全局安装 [pnpm](https://pnpm.io), 请参考 [pnpm 安装教程](https://pnpm.io/zh/installation#%E4%BD%BF%E7%94%A8-npm-%E5%AE%89%E8%A3%85)。
  3. 本项目要求 [Node](https://nodejs.org/en) 版本不低于 v16.14。

  ### 📦 安装依赖

  ```console
  $ pnpm install
  ```

  ### ⌨️ 启动项目

  运行下面的命令后，在浏览器访问 http://localhost:8081/
  ```console
  $ pnpm start
  ```

  ### 🖊️ 创建新的插件

  项目支持通过 createPlugin 命令快捷创建插件。
  ```console
  $ pnpm createPlugin
  ```
  - `请输入插件名称(aaa-bbb)`: 插件名称只支持脊柱命名法。
  - `请选择插件的实现方式`: 支持创建 React 组件和普通函数两种类型的插件。都支持支持选择使用 [Typescript](https://www.typescriptlang.org/)。
  - `请输入插件描述`: 这里可以简单描述一下这个插件的功能信息，后面也可以在 `/src/plugins/你的插件名/manifest` 文件内修改。
  - `请输入插件作者的名字`: 支持使用名字后面跟括号的形式设置给这个人添加一个可点击的链接，例如 Luka(https://ccw.site)， 如果要设置多个人，可以使用逗号隔开。

  ### 📖 PluginContext

  每个插件在创建的时候都会被传入一个 `api` 对象, 其包含的属性如下:

  ```typescript
  /**
   * 插件上下文接口，用于定义插件的上下文信息。
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
      * 向指定角色添加服装。
      * 如果未提供 targetId，则操作当前选中的角色。
      * @param {ArrayBuffer | string} buffer - 服装数据，可以是 ArrayBuffer 或字符串。
      * @param {string} fileName - 服装文件名。
      * @param {string} fileType - 服装文件类型。
      * @param {string} [targetId] - 角色的 ID（可选）。
      * @returns {void}
      */
      addCostumeToTarget: (buffer: ArrayBuffer | string, fileName: string, fileType: string, targetId?: string) => void;

      /**
      * 根据角色的 ID 删除指定服装。
      * 如果未提供 targetId，则操作当前选中的角色。
      * @param {number} costumeIndex - 服装索引。
      * @param {string} [targetId] - 角色的 ID（可选）。
      * @returns {void}
      */
      deleteCostumeByTargetId: (costumeIndex: number, targetId?: string) => void;

      /**
      * 从指定角色获取服装。
      * 如果未提供 targetId，则操作当前选中的角色。
      * @param {number} costumeIndex - 服装索引。
      * @param {string} [targetId] - 角色的 ID（可选）。
      * @returns {void}
      */
      getCostumeFromTarget: (costumeIndex: number, targetId?: string) => void;

      /**
       * 更新指定角色的造型。
       * @param {object} costumeData - 造型数据。
       * @param {string} [costumeData.costumeId] - 造型的唯一标识符（可选，优先使用），默认当前选中的造型。
       * @param {string} [costumeData.costumeId] - 造型的的索引（可选），默认当前选中的造型。
       * @param {boolean} costumeData.isVector - 是否为矢量图像。
       * @param {ArrayBufferLike | string} costumeData.bitmap - 造型位图或其数据。
       * @param {number} costumeData.rotationCenterX - 造型旋转中心的 X 坐标。
       * @param {number} costumeData.rotationCenterY - 造型旋转中心的 Y 坐标。
       * @param {number} costumeData.width - 造型宽度。
       * @param {number} costumeData.height - 造型高度。
       * @param {string} [targetId] - 目标的唯一标识符（可选），默认当前选中的角色。
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
      * 向指定角色添加声音。
      * 如果未提供 targetId，则操作当前选中的角色。
      * @param {ArrayBuffer | string} buffer - 声音数据，可以是 ArrayBuffer 或字符串。
      * @param {string} fileName - 声音文件名。
      * @param {string} fileType - 声音文件类型。
      * @param {string} [targetId] - 角色的 ID（可选）。
      * @returns {void}
      */
      addSoundToTarget: (buffer: ArrayBuffer | string, fileName: string, fileType: string, targetId?: string) => void;

      /**
      * 根据角色的 ID 删除指定声音。
      * 如果未提供 targetId，则操作当前选中的角色。
      * @param {number} soundIndex - 声音索引。
      * @param {string} [targetId] - 角色的 ID（可选）。
      * @returns {void}
      */
      deleteSoundFromTarget: (soundIndex: number, targetId?: string) => void;

      /**
      * 从指定角色获取声音。
      * 如果未提供 targetId，则操作当前选中的角色。
      * @param {number} soundIndex - 声音索引。
      * @param {string} [targetId] - 角色的 ID（可选）。
      * @returns {void}
      */
       getSoundFromTarget: (soundIndex: number, targetId?: string) => void;

      /**
       * 根据指定的角色的ID更新声音缓冲区。
       * 如果未提供targetId，则操作当前选中的角色。
       * @param {Object} soundData - 包含声音数据的对象。
       * @param {string} [soundData.soundId] - 声音的ID。
       * @param {number} [soundData.soundIndex] - 声音的索引。
       * @param {AudioBuffer} soundData.newBuffer - 新的声音缓冲区。
       * @param {ArrayBuffer} soundData.soundEncoding - 声音的编码。
       * @param {string} [targetId] - 所属角色的ID（可选）。
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
       * 拓展角色列表底部”加号“上的菜单项。
       * @param {Array<ActionMenuItem>} items - 要插入的的菜单选项。
       * @returns {void}
      */
      expandTargetMenuItems(items: Array<ActionMenuItem>): void;
  
      /**
       * 拓展造型列表底部”加号“上的菜单项。
       * @param {Array<ActionMenuItem>} items - 要插入的的菜单选项。
       * @returns {void}
      */
      expandCostumeMenuItems(items: Array<ActionMenuItem>): void;

      /**
       * 拓展声音列表底部”加号“上的菜单项。
       * @param {Array<ActionMenuItem>} items - 要插入的的菜单选项。
       * @returns {void}
      */
      expandSoundMenuItems(items: Array<ActionMenuItem>): void;

      /**
       * 移除某些角色列表底部”加号“上的菜单项。
       * @param {Array<string>} itemIdList - 要移除的菜单项的 ID 的数组。
       * @returns {void}
      */
      removeTargetMenuItems(itemIdList: Array<string>): void;

      /**
       * 移除某些造型列表底部”加号“上的菜单项。
       * @param {Array<string>} itemIdList - 要移除的菜单项的 ID 的数组。
       * @returns {void}
      */
      removeCostumeMenuItems(itemIdList: Array<string>): void;

      /**
       * 移除某些声音列表底部”加号“上的菜单项。
       * @param {Array<string>} itemIdList - 要移除的菜单项的 ID 的数组。
       * @returns {void}
      */
      removeSoundMenuItems(itemIdList: Array<string>): void;

      /**
       * 拓展右键点击角色时的菜单项。
       * @param {Array<ActionMenuItem>} items - 要插入的的菜单选项。
       * @returns {void}
      */
      expandTargetContextMenuItems(items: Array<ContextMenuItem>): void;

      /**
       * 拓展右键点击造型时的菜单项。
       * @param {Array<ActionMenuItem>} items - 要插入的的菜单选项。
       * @returns {void}
      */
      expandCostumeContextMenuItems(items: Array<ContextMenuItem>): void;

      /**
       * 拓展右键点击声音时的菜单项。
       * @param {Array<ActionMenuItem>} items - 要插入的的菜单选项。
       * @returns {void}
      */
      expandSoundContextMenuItems(items: Array<ContextMenuItem>): void;

      /**
       * 移除某些右键点击角色时的菜单选项。
       * @param {Array<string>} itemIdList - 要移除的菜单项的 ID 的数组。
       * @returns {void}
      */
      removeTargetContextMenuItems(itemKeyList: Array<string>): void;

      /**
       * 移除某些右键点击造型时的菜单选项。
       * @param {Array<string>} itemIdList - 要移除的菜单项的 ID 的数组。
       * @returns {void}
      */
      removeCostumeContextMenuItems(itemKeyList: Array<string>): void;
      
      /**
       * 移除某些右键点击声音时的菜单选项。
       * @param {Array<string>} itemIdList - 要移除的菜单项的 ID 的数组。
       * @returns {void}
      */
      removeSoundContextMenuItems(itemKeyList: Array<string>): void;

      /**
       * 获取所有扩展的信息。
       * @returns {Object} 一个包含所有扩展信息的对象，Key是拓展的ID。
       */
      getAllExtensionInfo(): Record<string, {
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
      }>;
    };
  }
  ```

  ### 🧐 F&Q

  以下是关于Gandi Plugins的常见问题，您应该在向社区提问或创建新问题之前查看这些问题。

  1. 如何做好的国际化
      在 PluginContext 上有 msg 的方法，当你在 `src/l10n` 下定义好 key , 然后再使用的地方将这个 key 传给 msg 方法即可。

  ```console
    msg('general.blocks.anticlockwise');
  ```

  2. 如何注册代码区菜单
      通过下面的方法来实现往代码区的菜单新增选项的功能。config 的 targetNames 是指你希望当选中那些对象时，显示你的菜单选项。

  ```javascript
    /**
     * The callback function called before menu is displayed if conditions are met.
     * callback: (items: Record<string, unknown>[], target: Record<string, unknown>, event: MouseEvent) => void;
     * The configuration options for the insertion condition.
     * config: {targetNames: Array<"workspace" | "blocks" | "frame" | "comment" | "toolbox">;}
    */
    const menuItemId = window.Blockly.ContextMenu.addDynamicMenuItem(callback, config);
    window.Blockly.ContextMenu.deleteDynamicMenuItem(menuItemId);
  ```

  3. 如何在设置里给自己的插件添加一些配置项
    在 PluginContext 上有 registerSettings 方法可以用来注册你的配置项。

  ```javascript
  const register = registerSettings(
    // 这是插件的名称，这里需要支持国际化
    msg("plugins.testPlugin.title"),\
    // 插件的ID，要求命名用 plugin-aaa-bbb 的形式
    "plugin-test-plugin",
    [
      {
        // 这是每一组配置的key
        key: "popup",
        // 这是这一组Key的名称
        label: msg("plugins.testPlugin.popupConfig"),
        items: [
          {
            // 这是每个配置的key
            key: "width",
            // 这是这一个配置的名称
            label: msg("plugins.testPlugin.popupWidth"),
            // 这是这一个配置的类型，支持 "switch" | "input" | "select" | "hotkey" 四种。
            type: "input",
            // 这个配置的默认值
            value: '100',
            // 当这个配置发生改变时的回调函数
            onChange: (value) => {
              console.log("value", value);
            },
          },
        ],
      },
    ],
    // 这个是插件的一个icon，可以是一个 React 组件，或者一个 img 的地址
    iconComponentOrIconLink,
  );
  ```

  4. 如何写好各种样式
    - 先熟悉 Gandi 的主题样式，所有的都在[CSS变量](https://developer.mozilla.org/zh-CN/docs/Web/CSS/Using_CSS_custom_properties)都在 :root 中，当你设置颜色时，最后使用这些变量来保证你的风格和 Gandi 的保持一致。
    - 如果你还不知道如何写 CSS，可以点 [这里](https://developer.mozilla.org/zh-CN/docs/Web/CSS) 进行学习。
    - 项目使用了 [Less](https://lesscss.org/)，它可以帮助你更高效地编写和组织 CSS 代码。
  
  5. 如何与 GUI 的 redux 进行交互
      在 PluginContext 上有一个 redux 对象，你可以通过 redux.state 来获取到 redux 的整个 state；如果你要监听某个 state 的变化，可以通过 `redux.addEventListener('statechanged', callback)` 来实现。

  ```javascript
    const vm = redux.state.scratchGui.vm;

    redux.addEventListener('statechanged', ({detail: {action, prev, next}}) => {});
  ```

## 项目结构

```console
├──plugin-template                 // 插件模板目录
│   ├──plugin-index-js.hbs         // JavaScript 插件索引的 Handlebars 模板
│   ├──plugin-index-react-js.hbs   // React JavaScript 插件索引的 Handlebars 模板
│   ├──plugin-index-react-ts.hbs   // React TypeScript 插件索引的 Handlebars 模板
│   ├──plugin-index-ts.hbs         // TypeScript 插件索引的 Handlebars 模板
│   ├──plugin-manifest.hbs         // 插件清单的 Handlebars 模板
│   └──styles.hbs                  // 插件样式的 Handlebars 模板
├──src                             // 源代码目录
│   ├──assets                      // 资源目录
│   ├──components                  // React 组件目录
│   │   ├──Bubble                  // Bubble 组件目录
│   │   │   ├──index.tsx           // Bubble 组件实现
│   │   │   ├──styles.less         // Bubble 组件样式
│   │   ├──ExpansionBox            // ExpansionBox 组件目录
│   │   │   ├──index.tsx           // ExpansionBox 组件实现
│   │   │   ├──styles.less         // ExpansionBox 组件样式
│   │   ├──IF                      // IF 组件目录
│   │   │   └──index.tsx           // IF 组件实现
│   │   ├──Tab                     // Tab 组件目录
│   │   │   ├──index.tsx           // Tab 组件实现
│   │   │   ├──styles.less         // Tab 组件样式
│   │   │   └──styles.less.d.ts    // 样式类型定义
│   │   └──Tooltip                 // Tooltip 组件目录
│   │       ├──index.tsx           // Tooltip 组件实现
│   │       ├──styles.less         // Tooltip 组件样式
│   │       └──styles.less.d.ts    // 样式类型定义
│   ├──hooks                       // React 钩子目录
│   │   └──useStorageInfo.ts       // 存储信息的自定义钩子
│   ├──l10n                        // 国际化目录
│   │   ├──en.json                 // 英文语言字符串
│   │   └──zh-cn.json              // 中文（简体）语言字符串
│   ├──lib                         // 库目录
│   │   ├──block-media.ts          // 块媒体库
│   │   ├──client-info.ts          // 客户端信息库
│   ├──plugins                     // 插件目录
│   │   ├──code-batch-select       // 代码批量选择插件目录
│   │   ├──code-filter             // 代码过滤插件目录
│   │   ├──code-find               // 代码查找插件目录
│   │   ├──code-switch             // 代码切换插件目录
│   │   ├──dev-tools               // 开发工具插件目录
│   │   ├──jump-to-def             // 跳转到定义插件目录
│   │   └──terminal                // 终端插件目录
│   ├──types                       // 类型定义目录
│   │   ├──blockly.d.ts            // Blockly 类型定义
│   │   ├──interface.d.ts          // 接口类型定义
│   │   └──scratch.d.ts            // Scratch 类型定义
│   ├──utils                       // 工具函数目录
│   │   ├──block-flasher.ts        // 块闪烁工具
│   │   ├──block-helper.ts         // 块助手工具
│   │   ├──blocks-keywords-parser.ts // 块关键字解析器工具
│   │   ├──color.ts                // 颜色工具
│   │   ├──dom-helper.ts           // DOM 帮助工具
│   │   ├──hotkey-helper.ts        // 快捷键帮助工具
│   │   ├──index.ts                // 索引工具
│   │   ├──workspace-utils.ts      // 工作空间工具
│   │   └──xml.ts                  // XML 工具
│   ├──index.tsx                   // React 应用程序的主入口点
│   ├──main.ts                     // TypeScript 应用程序的主入口点
│   ├──plugins-l10n.ts             // 插件国际化
│   ├──plugins-controller.ts       // 插件控制器
│   ├──plugins-entry.ts            // 插件入口点
│   ├──plugins-manifest.ts         // 插件清单
│   └──types.d.ts                  // 全局类型定义
├──.editorconfig                   // 编辑器配置文件
├──.eslintignore                   // ESLint 忽略文件
├──.eslintrc.json                  // ESLint 配置文件
├──.gitignore                      // Git 忽略文件
├──.prettierrc                     // Prettier 配置文件
├──LICENSE                         // 许可证文件
├──README-zh_CN.md                 // 中文版 Readme 文件
├──README.md                       // Readme 文件
├──favicon.ico                     // 网站图标
├──index.html                      // HTML 入口点
├──package.json                    // npm 包文件
├──plopfile.js                     // Plop 配置文件
├──pnpm-lock.yaml                  // pnpm 锁定文件
├──postcss.config.js               // PostCSS 配置文件
├──tsconfig.json                   // TypeScript 配置文件
├──webpack.config.js               // Webpack 配置文件
└──webpackDevServer.config.js      // Webpack Dev Server 配置文件
```