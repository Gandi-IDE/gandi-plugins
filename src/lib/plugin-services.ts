export interface PluginServices {
  blockSharing?: {
    contentBaseUrl?: string;
    importAssetBaseUrl?: string;
  };
  costumePiskel?: {
    editorUrl: string;
  };
  customExtensionVersionManager?: {
    apiBaseUrl: string;
    webBaseUrl: string;
  };
  customCss?: {
    defaultStylesheetUrl?: string;
  };
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

export interface PluginCapabilities {
  blockSharingLocalSvg: true;
  blockSharingRemoteContent: boolean;
  blockSharingRemoteImport: boolean;
  costumePiskel: boolean;
  customExtensionVersionManager: boolean;
  customCssDefaultStylesheet: boolean;
  inspiro: boolean;
  voiceCooperation: boolean;
}

type UrlProtocol = "http:" | "https:" | "ws:" | "wss:";

const normalizeUrl = (value: unknown, field: string, protocols: UrlProtocol[]): string | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new TypeError(`${field} must be an absolute URL.`);
  }

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new TypeError(`${field} must be an absolute URL.`);
  }

  if (!protocols.includes(url.protocol as UrlProtocol)) {
    throw new TypeError(`${field} must use one of these protocols: ${protocols.join(", ")}.`);
  }
  return url.toString();
};

const normalizeHttpUrl = (value: unknown, field: string) => normalizeUrl(value, field, ["http:", "https:"]);

export const normalizePluginServices = (services: PluginServices = {}): PluginServices => {
  const normalized: PluginServices = {};

  const blockSharingContent = normalizeHttpUrl(
    services.blockSharing?.contentBaseUrl,
    "pluginServices.blockSharing.contentBaseUrl",
  );
  const blockSharingImport = normalizeHttpUrl(
    services.blockSharing?.importAssetBaseUrl,
    "pluginServices.blockSharing.importAssetBaseUrl",
  );
  if (blockSharingContent || blockSharingImport) {
    normalized.blockSharing = {
      ...(blockSharingContent ? { contentBaseUrl: blockSharingContent } : {}),
      ...(blockSharingImport ? { importAssetBaseUrl: blockSharingImport } : {}),
    };
  }

  const piskelEditor = normalizeHttpUrl(services.costumePiskel?.editorUrl, "pluginServices.costumePiskel.editorUrl");
  if (piskelEditor) normalized.costumePiskel = { editorUrl: piskelEditor };

  const marketplaceApi = normalizeHttpUrl(
    services.customExtensionVersionManager?.apiBaseUrl,
    "pluginServices.customExtensionVersionManager.apiBaseUrl",
  );
  const marketplaceWeb = normalizeHttpUrl(
    services.customExtensionVersionManager?.webBaseUrl,
    "pluginServices.customExtensionVersionManager.webBaseUrl",
  );
  if (marketplaceApi && marketplaceWeb) {
    normalized.customExtensionVersionManager = {
      apiBaseUrl: marketplaceApi,
      webBaseUrl: marketplaceWeb,
    };
  }

  const defaultStylesheet = normalizeHttpUrl(
    services.customCss?.defaultStylesheetUrl,
    "pluginServices.customCss.defaultStylesheetUrl",
  );
  if (defaultStylesheet) normalized.customCss = { defaultStylesheetUrl: defaultStylesheet };

  const inspiroApi = normalizeHttpUrl(services.inspiro?.apiBaseUrl, "pluginServices.inspiro.apiBaseUrl");
  const inspiroAssets = normalizeHttpUrl(services.inspiro?.assetBaseUrl, "pluginServices.inspiro.assetBaseUrl");
  if (inspiroApi && inspiroAssets) {
    normalized.inspiro = {
      apiBaseUrl: inspiroApi,
      assetBaseUrl: inspiroAssets,
    };
  }

  const voiceLivekit = normalizeUrl(
    services.voiceCooperation?.livekitUrl,
    "pluginServices.voiceCooperation.livekitUrl",
    ["ws:", "wss:"],
  );
  if (voiceLivekit) {
    const connectedAudio = normalizeHttpUrl(
      services.voiceCooperation?.connectedAudioUrl,
      "pluginServices.voiceCooperation.connectedAudioUrl",
    );
    const memberJoinedAudio = normalizeHttpUrl(
      services.voiceCooperation?.memberJoinedAudioUrl,
      "pluginServices.voiceCooperation.memberJoinedAudioUrl",
    );
    normalized.voiceCooperation = {
      livekitUrl: voiceLivekit,
      ...(connectedAudio ? { connectedAudioUrl: connectedAudio } : {}),
      ...(memberJoinedAudio ? { memberJoinedAudioUrl: memberJoinedAudio } : {}),
    };
  }

  return normalized;
};

export const getPluginCapabilities = (services: PluginServices = {}): PluginCapabilities => {
  const normalized = normalizePluginServices(services);
  return {
    blockSharingLocalSvg: true,
    blockSharingRemoteContent: Boolean(normalized.blockSharing?.contentBaseUrl),
    blockSharingRemoteImport: Boolean(normalized.blockSharing?.importAssetBaseUrl),
    costumePiskel: Boolean(normalized.costumePiskel),
    customExtensionVersionManager: Boolean(normalized.customExtensionVersionManager),
    customCssDefaultStylesheet: Boolean(normalized.customCss?.defaultStylesheetUrl),
    inspiro: Boolean(normalized.inspiro),
    voiceCooperation: Boolean(normalized.voiceCooperation),
  };
};

export const getServiceUnavailablePlugins = (capabilities: PluginCapabilities): string[] => {
  const unavailablePlugins: string[] = [];
  if (!capabilities.costumePiskel) unavailablePlugins.push("costume-piskel");
  if (!capabilities.customExtensionVersionManager) unavailablePlugins.push("custom-extension-version-manager");
  if (!capabilities.inspiro) unavailablePlugins.push("inspiro");
  if (!capabilities.voiceCooperation) unavailablePlugins.push("voice-cooperation");
  return unavailablePlugins;
};

export const buildPluginServiceUrl = (
  baseUrl: string,
  relativePath: string,
  searchParams: Record<string, string | undefined> = {},
): string => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const url = new URL(relativePath.replace(/^\/+/, ""), normalizedBase);
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, value);
  });
  return url.toString();
};
