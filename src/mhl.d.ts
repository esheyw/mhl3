import type { AnyObject, SimpleMerge } from "fvtt-types/src/types/utils.d.mts";
import type { MHLCONFIG } from "./config.ts";
import type { MODULE_ID } from "./constants.ts";
import type { MHLSettingsManagerDefaults } from "./data/models/settings.ts";
import { MHLCore } from "./MHLCore.ts";
import type {
  MHLSettingDefinitionExtensions,
  MHLSettingMenuDefinitionExtensions,
} from "./util/MHLSettingsManager.ts";
import type { GetKey } from "fvtt-types/src/types/helperTypes.d.mts";

/**
 * General types
 */
type And<B1 extends boolean, B2 extends boolean> = B1 extends true ? B2 : false;

type Or<B1 extends boolean, B2 extends boolean> = B1 extends true ? true : B2;

type If<B extends boolean, Then, Else> = B extends true ? Then : Else;

type KeyIn<K extends PropertyKey, T> = T extends unknown
  ? K extends keyof T
    ? true
    : never
  : never;

type MakeBool<T, Default extends boolean = true> = T extends true
  ? true
  : T extends false
    ? false
    : Default;

type CouldBeTrue<T> = T extends true ? true : never;
type CouldBeFalse<T> = T extends false ? false : never;
type Extends<T, V> = T extends V ? true : false;

type SimpleTestFunction<T = unknown> = (value: T) => boolean;
type SortCallback = (a: unknown, b: unknown) => number;
type StringReplaceCallback = (match: string) => string;

type ConsoleType = "error" | "warn" | "log" | "info" | "debug" | "trace";

type Fromable<T> = Iterable<T> | ArrayLike<T>;

/**
 * ADVANCED MAGIC
 */

type WithDefaults<
  T extends AnyObject,
  Defaults extends AnyObject,
> = SimpleMerge<
  {
    [K in keyof T]: T[K] extends null | undefined ? GetKey<Defaults, K> : T[K];
  },
  Defaults
>;

type UnionToIntersection<U> = (
  U extends unknown ? (i: U) => void : never
) extends (i: infer I) => void
  ? I
  : never;

type PartialIf<
  T extends AnyObject,
  IsPartial extends boolean,
> = IsPartial extends true ? Partial<T> : T;

type PickWithValue<T, K extends keyof T, V> = {
  [K2 in keyof T as K2 extends K ? K : never]: V;
};

type Coalesce<T, D> = [T] extends [never] ? D : T;

type WithDefault<T, D> = T extends undefined ? D : Exclude<T, undefined>;
/**
 * Foundry-related types
 */

type BannerType = "error" | "warn" | "info";

/**
 * Declaration merging for fvtt-types
 */
type MHLSettings = {
  "manager-defaults": typeof MHLSettingsManagerDefaults;
};

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
