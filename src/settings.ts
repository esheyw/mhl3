import { MODULE_ID } from "./constants.ts";
import { MHLSettingsManagerDefaults } from "./data/models/settings.ts";
import type { MHLSettings } from "./mhl.d.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SETTINGS: Record<string, ClientSettings.RegisterOptions<any>> = {
  "manager-defaults": {
    scope: "world",
    type: MHLSettingsManagerDefaults,
    config: false,
    default: new MHLSettingsManagerDefaults().toObject(),
    group: ".SettingsManager",
  },
};

export function setting(key: keyof MHLSettings, { suppress = false } = {}) {
  const manager = game.modules.get(MODULE_ID).api.getSettingsManager(MODULE_ID);
  if (manager.initialized) return manager.get(key);
  else {
    let value;
    try {
      value = game.settings.get(MODULE_ID, key as ClientSettings.Key);
    } catch (error) {
      if (!suppress) console.error(error);
      return undefined;
    }
    return value;
  }
}
