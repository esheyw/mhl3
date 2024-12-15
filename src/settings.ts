import { MODULE_ID } from "./constants.ts";
import { MHLSettingsManagerDefaults } from "./data/models/settings.ts";
import type { MHLSettings } from "./mhl.d.ts";
import { MHLCore } from "./MHLCore.ts";

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

export function setting<TKey extends keyof MHLSettings>(
  key: TKey,
  { suppress = false } = {},
): MHLSettings[TKey] | undefined {
  const manager = MHLCore.instance.getSettingsManager(MODULE_ID);
  if (manager?.initialized)
    return manager.get(key) as MHLSettings[TKey] | undefined;
  else {
    let value;
    try {
      value = game.settings.get(
        MODULE_ID,
        key as ClientSettings.Key,
      ) as MHLSettings[TKey];
    } catch (error) {
      if (!suppress) console.error(error);
      return undefined;
    }
    return value;
  }
}
