const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildPluginServiceUrl,
  getPluginCapabilities,
  getServiceUnavailablePlugins,
  normalizePluginServices,
} = require("../.test-dist/lib/plugin-services.js");
const {
  fetchMarketplaceExtension,
  getMarketplacePageUrl,
} = require("../.test-dist/plugins/custom-extension-version-manager/marketplace.js");

test("missing services keep local block sharing and fail closed for remote plugins", () => {
  const capabilities = getPluginCapabilities();

  assert.deepEqual(capabilities, {
    blockSharingLocalSvg: true,
    blockSharingRemoteContent: false,
    blockSharingRemoteImport: false,
    costumePiskel: false,
    customExtensionVersionManager: false,
    customCssDefaultStylesheet: false,
    inspiro: false,
    voiceCooperation: false,
  });
  assert.deepEqual(getServiceUnavailablePlugins(capabilities), [
    "costume-piskel",
    "custom-extension-version-manager",
    "inspiro",
    "voice-cooperation",
  ]);
});

test("block sharing remote capabilities are independent from its local SVG tools", () => {
  const contentOnly = getPluginCapabilities({
    blockSharing: { contentBaseUrl: "https://learn.example.test/root" },
  });
  const importOnly = getPluginCapabilities({
    blockSharing: { importAssetBaseUrl: "https://assets.example.test/blocks" },
  });

  assert.equal(contentOnly.blockSharingLocalSvg, true);
  assert.equal(contentOnly.blockSharingRemoteContent, true);
  assert.equal(contentOnly.blockSharingRemoteImport, false);
  assert.equal(importOnly.blockSharingLocalSvg, true);
  assert.equal(importOnly.blockSharingRemoteContent, false);
  assert.equal(importOnly.blockSharingRemoteImport, true);
});

test("a Cocrea profile exposes only explicitly configured and verified services", () => {
  const capabilities = getPluginCapabilities({
    inspiro: {
      apiBaseUrl: "https://gandi-main.cocrea.world",
      assetBaseUrl: "https://d3sh2pl0ajjotb.cloudfront.net",
    },
  });

  assert.equal(capabilities.inspiro, true);
  assert.equal(capabilities.costumePiskel, false);
  assert.equal(capabilities.customExtensionVersionManager, false);
  assert.equal(capabilities.voiceCooperation, false);
});

test("service URLs are absolute, protocol constrained, and normalized", () => {
  const normalized = normalizePluginServices({
    costumePiskel: { editorUrl: " https://editor.example.test/piskel " },
    voiceCooperation: { livekitUrl: "wss://voice.example.test" },
  });

  assert.equal(normalized.costumePiskel.editorUrl, "https://editor.example.test/piskel");
  assert.equal(normalized.voiceCooperation.livekitUrl, "wss://voice.example.test/");
  assert.throws(() => normalizePluginServices({ costumePiskel: { editorUrl: "/relative/piskel" } }), /absolute URL/);
  assert.throws(
    () => normalizePluginServices({ voiceCooperation: { livekitUrl: "https://voice.example.test" } }),
    /must use one of these protocols/,
  );
});

test("service URL construction preserves a configured base path", () => {
  assert.equal(
    buildPluginServiceUrl("https://service.example.test/base", "extensions/My%20Extension"),
    "https://service.example.test/base/extensions/My%20Extension",
  );
  assert.equal(
    buildPluginServiceUrl("https://service.example.test/base/", "/article/123", { hideHeader: "", JumpLink: "a.png" }),
    "https://service.example.test/base/article/123?hideHeader=&JumpLink=a.png",
  );
});

test("marketplace requests and page links use the configured service", async () => {
  const originalFetch = global.fetch;
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      json: async () => ({
        status: 200,
        code: "200",
        body: {
          eid: "My Extension",
          name: "Configured marketplace extension",
          versions: [{ id: 7, version: "1.0.0", assetUri: "https://cdn.example.test/ext.js" }],
        },
      }),
    };
  };

  try {
    const service = {
      apiBaseUrl: "https://api.example.test/marketplace",
      webBaseUrl: "https://web.example.test/store",
    };
    const detail = await fetchMarketplaceExtension(service, "My Extension");

    assert.equal(calls[0].url, "https://api.example.test/marketplace/extensions/My%20Extension");
    assert.equal(calls[0].options.credentials, "omit");
    assert.equal(detail.versions[0].url, "https://cdn.example.test/ext.js");
    assert.equal(
      getMarketplacePageUrl(service, "My Extension"),
      "https://web.example.test/store/extension/My%20Extension",
    );
  } finally {
    global.fetch = originalFetch;
  }
});
