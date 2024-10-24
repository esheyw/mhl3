import { MODULE_ID } from "./constants.ts";
import {
  MHLSettingsManager,
  type MHLSettingsManagerAssignmentOptions,
} from "./util/MHLSettingsManager.ts";
import * as R from "remeda";

export class MHLCore {
  static #instance: MHLCore | undefined;
  static get instance(): MHLCore | undefined {
    return this.#instance;
  }

  static #MANAGER_OPTIONS: MHLSettingsManagerAssignmentOptions = {};
  #settingsManagers: Collection<MHLSettingsManager> = new Collection();

  get settingsManagers(): Collection<MHLSettingsManager> {
    return this.#settingsManagers;
  }

  get R() {
    return R;
  }
  test: number = 5;
  constructor() {
    if (MHLCore.instance instanceof MHLCore) return MHLCore.instance;
    MHLCore.#instance = this;
    this.#settingsManagers.set(
      MODULE_ID,
      new MHLSettingsManager(MODULE_ID, MHLCore.#MANAGER_OPTIONS),
    );
  }
}
