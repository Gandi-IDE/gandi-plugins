# Host-provided plugin services

`gandi-plugins` does not infer a site from `window.location`. A host supplies the remote services it owns or has verified through the `pluginServices` option passed to `PluginsController`.

Missing configuration is a capability decision, not a request to guess a sibling domain. The controller automatically adds fully remote plugins with missing service configuration to `unavailablePlugins`. `block-sharing` remains available because local SVG export, copy, paste, and file-drop import do not require a remote service.

## Contract

```ts
interface PluginServices {
  blockSharing?: {
    contentBaseUrl?: string;
    importAssetBaseUrl?: string;
  };
  costumePiskel?: { editorUrl: string };
  customExtensionVersionManager?: {
    apiBaseUrl: string;
    webBaseUrl: string;
  };
  customCss?: { defaultStylesheetUrl?: string };
  inspiro?: {
    apiBaseUrl: string;
    assetBaseUrl: string;
  };
  voiceCooperation?: {
    livekitUrl: string;
    connectedAudioUrl?: string;
    memberJoinedAudioUrl?: string;
  };
}
```

HTTP content must use an absolute `http:` or `https:` URL. LiveKit must use an absolute `ws:` or `wss:` URL. Invalid configured URLs fail when the controller is created; absent services are reported as unavailable.

`customExtensionVersionManager` requires both marketplace URLs and `inspiro` requires both API and asset URLs. Their capabilities stay false if either half is absent. `voiceCooperation` additionally depends on the host's existing `server.hosts.GANDI_MAIN/rtc/join` token endpoint; configuring LiveKit does not create or replace that backend.

The bundle exports `normalizePluginServices`, `getPluginCapabilities`, and `getServiceUnavailablePlugins`. A controller instance also exposes its derived `capabilities` property.

Capabilities report validated configuration availability, not continuous service health. The host can call `getPluginCapabilities(pluginServices)` before controller construction and use the result for UI or telemetry. `blockSharingLocalSvg` is always true; remote content and remote deep-link import are separate flags.

## CCW profile

These are the existing CCW routes, moved out of plugin implementations and spot-checked on 2026-08-28. The host must still own environment selection, monitoring, and rollout:

```ts
const pluginServices = {
  blockSharing: {
    contentBaseUrl: "https://learn.ccw.site",
    importAssetBaseUrl: "https://m.ccw.site/creator-college/images",
  },
  costumePiskel: {
    editorUrl: "https://ai-static.ccw.site/test/piskel-1e80317/index.html",
  },
  customExtensionVersionManager: {
    apiBaseUrl: "https://bfs-web.ccw.site",
    webBaseUrl: "https://assets.ccw.site",
  },
  customCss: {
    defaultStylesheetUrl: "https://m.ccw.site/gandi/default.css",
  },
  inspiro: {
    apiBaseUrl: "https://gandi-main.ccw.site",
    assetBaseUrl: "https://m.ccw.site",
  },
  voiceCooperation: {
    livekitUrl: "wss://voice.ccw.site",
  },
};
```

The custom CSS URL is only the initial value shown in the URL input; it is not loaded until the user changes that setting. Hosts may omit it.

## Cocrea profile

Only the existing Inspiro routes had current evidence in the Cocrea stack on 2026-08-28:

```ts
const pluginServices = {
  inspiro: {
    apiBaseUrl: "https://gandi-main.cocrea.world",
    assetBaseUrl: "https://d3sh2pl0ajjotb.cloudfront.net",
  },
};
```

The image and music endpoints exist, return the expected authentication error while signed out, allow credentialed requests from `https://cocrea.world`, and the configured avatar assets are PNG files. A signed-in generation smoke test is still required before enabling Inspiro in production.

Do not add inferred `learn.cocrea.world`, `ai-static.cocrea.world`, `bfs-web.cocrea.world`, `assets.cocrea.world` marketplace paths, or `voice.cocrea.world` routes. No matching deployed business service was verified for them. In this profile:

- `block-sharing` keeps local SVG export, copy, paste, and file-drop import; its remote browser and deep-link fetch are unavailable.
- `costume-piskel` and `custom-extension-version-manager` are unavailable.
- `custom-css` has an empty URL example but keeps all local theme and user-entered URL behavior.
- `code-find` uses no site-owned empty-state image.
- `voice-cooperation` is explicitly unavailable because no Cocrea LiveKit service is configured.

## Consumer wiring

`gandi-gui` needs a `pluginServices` prop. On the current `origin/main` integration path:

1. `src/components/gui/gui.jsx` passes the prop to `src/containers/plugins.jsx`.
2. `src/containers/plugins.jsx` passes it to `usePluginsContext` and declares its PropType.
3. `src/hooks/usePluginsContext.js` includes it in the initial context and updates it when the prop changes.

That context is already passed directly to `new PluginsClass(context)`. Keep `unavailablePlugins` as an additional product-policy override; it is unioned with service-derived unavailability inside `gandi-plugins`.

`hub-international` should define its Cocrea profile from reviewed public environment configuration and pass it through:

```tsx
<GandiGUI
  pluginServices={COCREA_PLUGIN_SERVICES}
  pluginsScriptSrc={process.env.NEXT_PUBLIC_GANDI_PLUGINS_JS_FILE}
  unavailablePlugins={UNAVAILABLE_PLUGINS}
/>
```

After a signed-in Inspiro smoke test, `hub-international` may remove `inspiro` from its explicit `UNAVAILABLE_PLUGINS`. It should keep no voice service entry; the plugin bundle will report and enforce `voiceCooperation: false`.
