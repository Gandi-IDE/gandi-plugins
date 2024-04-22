export default {
  folder: () => import(/* webpackChunkName: "plugin-folder-manifest" */ "src/plugins/folder/manifest"),
  "code-find": () => import(/* webpackChunkName: "plugin-code-find-manifest" */ "src/plugins/code-find/manifest"),
  "code-filter": () => import(/* webpackChunkName: "plugin-code-filter-manifest" */ "src/plugins/code-filter/manifest"),
  "dev-tools": () => import(/* webpackChunkName: "plugin-dev-tools-manifest" */ "src/plugins/dev-tools/manifest"),
  "code-switch": () => import(/* webpackChunkName: "plugin-code-switch-manifest" */ "src/plugins/code-switch/manifest"),
  terminal: () => import(/* webpackChunkName: "plugin-terminal-manifest" */ "src/plugins/terminal/manifest"),
  "code-batch-select": () => import(/* webpackChunkName: "plugin-code-batch-select-manifest" */ "src/plugins/code-batch-select/manifest"),
  "dropdown-searchable": () => import(/* webpackChunkName: "plugin-dropdown-searchable-manifest" */ "src/plugins/dropdown-searchable/manifest"),
  statistics: () => import(/* webpackChunkName: "plugin-statistics-manifest" */ "src/plugins/statistics/manifest"),
  "historical-version": () => import(/* webpackChunkName: "plugin-historical-version-manifest" */ "src/plugins/historical-version/manifest"),
} as const;
