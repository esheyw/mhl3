import { MODULE_ID } from "./constants.ts";
import MHLSettingsManager from "./util/MHLSettingsManager.ts";
import * as R from "remeda";
import * as data from "./data/index.ts";
import * as helpers from "./helpers/index.ts";

export class MHLCore {
  static #instance: MHLCore;
  static get instance(): MHLCore {
    return this.#instance;
  }

  static #MANAGER_OPTIONS: MHLSettingsManager.AssignmentOptions = {};
  #settingsManagers: Collection<MHLSettingsManager> = new Collection();

  #remeda = Object.freeze(R);

  #data = Object.freeze(data);

  #helpers = Object.freeze(helpers);

  #signedIntFormatter = new Intl.NumberFormat(game.i18n.lang, {
    maximumFractionDigits: 0,
    signDisplay: "always",
  });

  constructor() {
    if (MHLCore.#instance instanceof MHLCore)
      throw new Error("Only one MHLCore allowed");
    MHLCore.#instance = this;
    this.createSettingsManager(MODULE_ID, MHLCore.#MANAGER_OPTIONS);
  }

  get remeda() {
    return this.#remeda;
  }

  get data() {
    return this.#data;
  }

  get helpers() {
    return this.#helpers;
  }

  get signedIntFormatter() {
    return this.#signedIntFormatter;
  }

  createSettingsManager(
    modID: string,
    options: MHLSettingsManager.AssignmentOptions = {},
  ): MHLSettingsManager {
    if (this.#settingsManagers.get(modID))
      throw new Error(`Module ${modID} already has a Settings Manager.`);
    const modFor = game.modules.get(modID);
    // Erroneously marked unnecessary by types module handling
    //TODO: fix `game.modules.get` return type
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!modFor?.active)
      throw new Error(
        `${modID} is not an active module. MHLSettingManager creation aborted.`,
      );
    const newManager = new MHLSettingsManager(modFor, options);
    this.#settingsManagers.set(modID, newManager);
    return newManager;
  }

  getSettingsManager(modID: string): MHLSettingsManager | undefined {
    return this.#settingsManagers.get(modID);
  }
}
