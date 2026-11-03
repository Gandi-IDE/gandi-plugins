import PluginsController from "./plugins-controller";
import Plugins from "./plugins-entry";

export const PluginNames = Object.keys(Plugins);
export {
  buildPluginServiceUrl,
  getPluginCapabilities,
  getServiceUnavailablePlugins,
  normalizePluginServices,
} from "./lib/plugin-services";
export type { PluginCapabilities, PluginServices } from "./lib/plugin-services";
export { PluginsController as default };
