/* eslint-disable prettier/prettier */
export default {
  folder: () => import(/* webpackChunkName: "plugin-folder" */ "src/plugins/folder"),
  "code-find": () => import(/* webpackChunkName: "plugin-code-find" */ "src/plugins/code-find"),
  "code-filter": () => import(/* webpackChunkName: "plugin-code-filter" */ "src/plugins/code-filter"),
  "dev-tools": () => import(/* webpackChunkName: "plugin-dev-tools" */ "src/plugins/dev-tools"),
  "code-switch": () => import(/* webpackChunkName: "plugin-code-switch" */ "src/plugins/code-switch"),
  terminal: () => import(/* webpackChunkName: "plugin-terminal" */ "src/plugins/terminal"),
  "code-batch-select": () => import(/* webpackChunkName: "plugin-code-batch-select" */ "src/plugins/code-batch-select"),
  "dropdown-searchable": () =>
    import(/* webpackChunkName: "plugin-dropdown-searchable" */ "src/plugins/dropdown-searchable"),
  statistics: () => import(/* webpackChunkName: "plugin-statistics" */ "src/plugins/statistics"),
  "historical-version": () =>
    import(/* webpackChunkName: "plugin-historical-version" */ "src/plugins/historical-version"),
  "custom-plugin": () => import(/* webpackChunkName: "plugin-custom-plugin" */ "src/plugins/custom-plugin"),
  "witcat-blockinput": () => import(/* webpackChunkName: "plugin-witcat-blockinput" */ "src/plugins/witcat-blockinput"),
  "kukemc-beautify": () => import(/* webpackChunkName: "plugin-kukemc-beautify" */ "src/plugins/kukemc-beautify"),
  "fast-input": () => import(/* webpackChunkName: "plugin-fast-input" */ "src/plugins/fast-input"),
  "better-sprite-menu": () => import(/* webpackChunkName: "plugin-better-sprite-menu" */ "plugins/better-sprite-menu"),
  inspiro: () => import(/* webpackChunkName: "plugin-inspiro" */ "src/plugins/inspiro"),
  "custom-css": () => import(/* webpackChunkName: "plugin-custom-css" */ "src/plugins/custom-css"),
  "extension-manager": () => import(/* webpackChunkName: "plugin-extension-manager" */ "src/plugins/extension-manager"),
  "voice-cooperation": () => import(/* webpackChunkName: "plugin-voice-cooperation" */ "src/plugins/voice-cooperation"),
} as const;
