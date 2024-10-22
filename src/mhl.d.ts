import type { AnyObject } from "fvtt-types/src/types/utils.d.mts";
import type { MHLCONFIG } from "./config.ts";
import type { MODULE_ID } from "./constants.ts";
import type { MHLSettingsManagerDefaults } from "./data/models/settings.ts";
import { MHLCore } from "./MHLCore.ts";
import type {
  MHLSettingDefinitionExtensions,
  MHLSettingMenuDefinitionExtensions,
} from "./util/MHLSettingsManager.ts";

/**
 * General types
 */

type SimpleTestFunction<T = unknown> = (value: T) => boolean;
type SortCallback = (a: unknown, b: unknown) => number;
type StringReplaceCallback = (match: string) => string;
type ConsoleType = "error" | "warn" | "log" | "info" | "debug" | "trace";
type Fromable<T> = Iterable<T> | ArrayLike<T>;

/**
 * Foundry-related types
 */

type BannerType = "error" | "warn" | "info";

/**
 * Declaration merging for fvtt-types
 */
type MHLSettings = {
  "manager-defaults": typeof MHLSettingsManagerDefaults;
}

type WithPrefix<T extends AnyObject, Prefix extends string> = {
  [K in keyof T as K extends string ? `${Prefix}${K}` : K]: T[K];
};

declare global {
  // eslint-disable-next-line no-var
  var mhl: MHLCore;

  interface AssumeHookRan {
    init: true;
  }

  interface ModuleConfig {
    [MODULE_ID]: { api?: MHLCore };
  }
  interface RequiredModules {
    [MODULE_ID]: true;
  }
  interface CONFIG {
    [MODULE_ID]: typeof MHLCONFIG;
  }

  namespace ClientSettings {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-object-type
    interface RegisterOptions<T> extends MHLSettingDefinitionExtensions {}
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface SettingSubmenuConfig extends MHLSettingMenuDefinitionExtensions {}
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface SettingConfig extends WithPrefix<MHLSettings, `${MODULE_ID}.`> {}
}
