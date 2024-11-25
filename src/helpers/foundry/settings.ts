type UnsetModuleSettingsOptions = {
  /** Whether to unset client settings in the browser running this function */
  client: boolean;
  /** Whether to unset world settings */
  world: boolean;
};

/**
 * Unset all settings for a given module in both the world and current browser
 *
 * @param modID   - The module ID (or module instance) to unset settings for
 * @param options - Options
 * @returns The number of settings unset for each type as object properties, `{ client, world}`
 */
export function unsetModuleSettings(
  modID: string | Module,
  { client = true, world = true } = {},
): { client: number; world: number } {
  if (modID instanceof foundry.packages.BaseModule) {
    modID = modID.id;
  }
  const out = {
    client: 0,
    world: 0,
  };
  if (client) {
    const clientStorage = game.settings.storage.get("client") as Storage;
    for (const clientKey of Object.keys(clientStorage)) {
      if (clientKey.startsWith(modID)) {
        out.client++;
        clientStorage.removeItem(clientKey);
      }
    }
  }
  if (world) {
    const worldStorage = game.settings.storage.get("world") as WorldSettings;
    for (const worldSetting of worldStorage) {
      if (worldSetting.key.startsWith(modID)) {
        out.world++;
        void worldSetting.delete();
      }
    }
  }
  //TODO: add FCS reset support
  return out;
}
