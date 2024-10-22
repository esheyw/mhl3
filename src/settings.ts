import { MHLSettingsManagerDefaults } from "./data/models/settings.ts";

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
