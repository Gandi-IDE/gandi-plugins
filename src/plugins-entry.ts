/* eslint-disable prettier/prettier */
export default {
  folder: () => import(/* webpackChunkName: "plugin-folder" */ "src/plugins/folder"),
  "code-find": () => import(/* webpackChunkName: "plugin-code-find" */ "src/plugins/code-find"),
  "code-filter": () => import(/* webpackChunkName: "plugin-code-filter" */ "src/plugins/code-filter"),
  "dev-tools": () => import(/* webpackChunkName: "plugin-dev-tools" */ "src/plugins/dev-tools"),
  "code-switch": () => import(/* webpackChunkName: "plugin-code-switch" */ "src/plugins/code-switch"),
  terminal: () => import(/* webpackChunkName: "plugin-terminal" */ "src/plugins/terminal"),
  "code-batch-select": () => import(/* webpackChunkName: "plugin-code-batch-select" */ "src/plugins/code-batch-select"),
  "dropdown-searchable": () => import(/* webpackChunkName: "plugin-dropdown-searchable" */ "src/plugins/dropdown-searchable"),
  statistics: () => import(/* webpackChunkName: "plugin-statistics" */ "src/plugins/statistics"),
  "historical-version": () => import(/* webpackChunkName: "plugin-historical-version" */ "src/plugins/historical-version"),
  "custom-plugin": () => import(/* webpackChunkName: "plugin-custom-plugin" */ "src/plugins/custom-plugin"),
} as const;
