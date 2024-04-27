import styles from "./styles.less";

const CustomColorways = ({ registerSettings, msg }: PluginContext) => {
  // 设置脚本区背景颜色
  function setCodeShoreColor(color: string) {
    document.documentElement.style.setProperty("--theme-color-500", color);
  }
  
  // 设置组件背景颜色
  function setUnitColor(color: string) {
    document.documentElement.style.setProperty("--theme-color-300", color);
  }
  
  // 设置UI边框颜色
  function setUiBorderColor(color: string) {
    document.documentElement.style.setProperty("--theme-color-200", color);
  }  
  
  // 设置 “当前选项” 的提示颜色（即无更改情况下，积木区拓展选项的蓝色部分）
  function setThisPromptsColor(color: string) {
    document.documentElement.style.setProperty("--theme-color-b200", color);
  }
  const register = registerSettings(
    // 这是插件的名称，这里需要支持国际化
    msg("plugins.custonColorways.title"),
    "custom-colorways",
    [
      {
        // 这是每一组配置的key
        key: "code",
        // 这是这一组Key的名称
        label: msg("plugins.custonColorways.title"),
        items: [
          {
            // 这是每个配置的key
            key: "code",
            // 这是这一个配置的名称
            label: msg("plugins.custonColorways.code"),
            // 这是这一个配置的类型，支持 "switch" | "input" | "select" | "hotkey" 四种。
            type: "input",
            // 这个配置的默认值
            value: '#191e25',
            // 当这个配置发生改变时的回调函数
            onChange: (value:string) => {
              setCodeShoreColor(value);
            },
          },
          {
            // 这是每个配置的key
            key: "unit",
            // 这是这一个配置的名称
            label: msg("plugins.custonColorways.unit"),
            // 这是这一个配置的类型，支持 "switch" | "input" | "select" | "hotkey" 四种。
            type: "input",
            // 这个配置的默认值
            value: '#2e3644',
            // 当这个配置发生改变时的回调函数
            onChange: (value:string) => {
              setUnitColor(value);
            },
          },
          {
            // 这是每个配置的key
            key: "UIB",
            // 这是这一个配置的名称
            label: msg("plugins.custonColorways.unitB"),
            // 这是这一个配置的类型，支持 "switch" | "input" | "select" | "hotkey" 四种。
            type: "input",
            // 这个配置的默认值
            value: '#3e495b',
            // 当这个配置发生改变时的回调函数
            onChange: (value:string) => {
              setUiBorderColor(value);
            },
          },
          {
            // 这是每个配置的key
            key: "This",
            // 这是这一个配置的名称
            label: msg("plugins.custonColorways.this"),
            // 这是这一个配置的类型，支持 "switch" | "input" | "select" | "hotkey" 四种。
            type: "input",
            // 这个配置的默认值
            value: '#134c91',
            // 当这个配置发生改变时的回调函数
            onChange: (value:string) => {
              setThisPromptsColor(value);
            },
          },
        ],
      },
    ],
    // 这个是插件的一个icon，可以是一个 React 组件，或者一个 img 的地址
    "",
  );



  return {
    dispose: () => {
      /** Remove some side effects */
      register.dispose();
    },
  };
};

export default CustomColorways;
