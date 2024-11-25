import { MODULE_ID } from "./constants.ts";
import MHLSettingsManager from "./util/MHLSettingsManager.ts";
import * as R from "remeda";

export class MHLCore {
  static #instance: MHLCore | undefined;
  static get instance(): MHLCore | undefined {
    return this.#instance;
  }

  static #MANAGER_OPTIONS: MHLSettingsManager.AssignmentOptions = {};
  #settingsManagers: Collection<MHLSettingsManager> = new Collection();

  // get settingsManagers(): Collection<MHLSettingsManager> {
  //   return this.#settingsManagers;
  // }

  get remeda() {
    return R;
  }

  constructor() {
    if (MHLCore.instance instanceof MHLCore) return MHLCore.instance;
    MHLCore.#instance = this;
    this.#settingsManagers.set(
      MODULE_ID,
      new MHLSettingsManager(MODULE_ID, MHLCore.#MANAGER_OPTIONS),
    );
  }

  getSettingsManager(
    modID: string,
    options: MHLSettingsManager.AssignmentOptions = {},
  ): MHLSettingsManager {
    const existing = this.#settingsManagers.get(modID);
    if (existing) return existing;
    const modFor = game.modules.get(modID);
    // Erroneously marked unnecessary by types module handling
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!modFor?.active)
      throw new Error(
        `${modID} is not an active module. MHLSettingManager creation aborted.`,
      );
    const newManager = new MHLSettingsManager(modFor, options);
    this.#settingsManagers.set(modID, newManager);
    return newManager;
  }
}
