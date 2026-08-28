import { ExtensionVersion, MarketplaceExtensionDetail } from "./types";
import { buildPluginServiceUrl, PluginServices } from "../../lib/plugin-services";

type MarketplaceService = NonNullable<PluginServices["customExtensionVersionManager"]>;

type MarketplaceVersionPayload = {
  id?: number | string;
  assetUri?: string;
  version?: string;
  releasedAt?: string | number;
  changelog?: string;
  releaseTags?: string[];
};

type MarketplaceDetailResponse = {
  status?: number | string;
  code?: number | string;
  msg?: string;
  body?: {
    eid?: string;
    name?: string;
    versions?: MarketplaceVersionPayload[];
  };
};

export type MarketplaceErrorCode = "HTTP_ERROR" | "API_ERROR" | "INVALID_RESPONSE";

export class MarketplaceRequestError extends Error {
  code: MarketplaceErrorCode;
  status?: number;

  constructor(code: MarketplaceErrorCode, message: string, status?: number) {
    super(message);
    this.name = "MarketplaceRequestError";
    this.code = code;
    this.status = status;
  }
}

const isHttpUrl = (value: unknown): value is string => {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const normalizeVersion = (value: MarketplaceVersionPayload, index: number): ExtensionVersion | null => {
  if (!isHttpUrl(value.assetUri)) return null;

  const label = typeof value.version === "string" && value.version.trim() ? value.version.trim() : `#${index + 1}`;
  const releaseTags = Array.isArray(value.releaseTags)
    ? value.releaseTags.filter((tag): tag is string => typeof tag === "string" && Boolean(tag.trim()))
    : [];

  return {
    id: String(value.id ?? `${label}-${index}`),
    label,
    url: value.assetUri,
    releasedAt: value.releasedAt,
    changelog: typeof value.changelog === "string" ? value.changelog.trim() : "",
    releaseTags,
  };
};

export const getMarketplacePageUrl = (service: MarketplaceService, extensionId: string) =>
  buildPluginServiceUrl(service.webBaseUrl, `extension/${encodeURIComponent(extensionId)}`);

export const fetchMarketplaceExtension = async (
  service: MarketplaceService,
  extensionId: string,
  signal?: AbortSignal,
): Promise<MarketplaceExtensionDetail> => {
  const response = await fetch(
    buildPluginServiceUrl(service.apiBaseUrl, `extensions/${encodeURIComponent(extensionId)}`),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "omit",
      signal,
    },
  );

  if (!response.ok) {
    throw new MarketplaceRequestError(
      "HTTP_ERROR",
      `Marketplace request failed with status ${response.status}.`,
      response.status,
    );
  }

  const payload = (await response.json()) as MarketplaceDetailResponse;
  if (String(payload.status) !== "200" || String(payload.code) !== "200") {
    throw new MarketplaceRequestError("API_ERROR", payload.msg || "Marketplace API rejected the request.");
  }
  if (!payload.body || !Array.isArray(payload.body.versions)) {
    throw new MarketplaceRequestError("INVALID_RESPONSE", "Marketplace response does not contain a version list.");
  }

  return {
    eid: payload.body.eid || extensionId,
    name: payload.body.name || extensionId,
    versions: payload.body.versions
      .map(normalizeVersion)
      .filter((version): version is ExtensionVersion => Boolean(version)),
  };
};
