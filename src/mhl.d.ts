import MHLSettingsManager from "./util/MHLSettingsManager.ts";
import type { AnyObject, SimpleMerge } from "fvtt-types/src/types/utils.d.mts";
import type { GetKey } from "fvtt-types/src/types/helperTypes.d.mts";
import type { MHLCONFIG } from "./config.ts";
import type { MHLSettingsManagerDefaults } from "./data/models/settings.ts";
import type { MODULE_ID } from "./constants.ts";
import type { fields } from "fvtt-types/src/foundry/common/data/module.d.mts";
import { MHLCore } from "./MHLCore.ts";
/**
 * Conditional-related types
 */

type And<B1 extends boolean, B2 extends boolean> = B1 extends true ? B2 : false;

type Or<B1 extends boolean, B2 extends boolean> = B1 extends true ? true : B2;

type If<B extends boolean, Then, Else> = B extends true ? Then : Else;

type KeyIn<K extends PropertyKey, T> = T extends unknown
  ? K extends keyof T
    ? true
    : never
  : never;

type CouldBeTrue<T> = T extends true ? true : never;
type CouldBeFalse<T> = T extends false ? false : never;
type Extends<T, V> = T extends V ? true : false;

type PartialIf<
  T extends AnyObject,
  IsPartial extends boolean,
> = IsPartial extends true ? Partial<T> : T;

/**
 * General types
 */

type SimpleTestFunction<T = unknown> = (value: T) => boolean;
type SortCallback<TCompared = never> = (a: TCompared, b: TCompared) => number;
type StringReplaceCallback = (match: string) => string;

type Fromable<T> = Iterable<T> | ArrayLike<T>;
type MapOrFromableEntries<K, V> = Map<K, V> | Fromable<[K, V]>;

// stolen from pf2e
type SetElement<TSet extends Set<unknown>> =
  TSet extends Set<infer TElement> ? TElement : never;

type StringArgs = string | StringArgs[];

type WithPrefix<T extends AnyObject, Prefix extends string> = {
  [K in keyof T as K extends string ? `${Prefix}${K}` : K]: T[K];
};

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

type PickWithValue<T, K extends keyof T, V> = {
  [K2 in keyof T as K2 extends K ? K : never]: V;
};

type Coalesce<T, D> = [T] extends [never] ? D : T;

type WithDefault<T, D> = T extends undefined ? D : Exclude<T, undefined>;

/**
 * Foundry-related types
 */

type SelectOptionsEntry<
  valueAttr extends string | number = "value",
  labelAttr extends string | number = "label",
> = {
  [K in valueAttr]: string | number;
} & { [K in labelAttr]: string | number } & {
  group?: string;
  selected?: boolean;
  disabled?: boolean;
  rule?: boolean;
};

type SelectOptionsThatWorkWithoutOptions =
  | string[]
  | number[]
  | Record<string | number, string | number>
  | Array<SelectOptionsEntry>;

type NotificationType = Notifications.Notification["type"];
type AudioFilePath = `${string}.${keyof typeof CONST.AUDIO_FILE_EXTENSIONS}`;
type ImageFilePath = `${string}.${keyof typeof CONST.IMAGE_FILE_EXTENSIONS}`;
type VideoFilePath = `${string}.${keyof typeof CONST.VIDEO_FILE_EXTENSIONS}`;
type MediaFilePath = AudioFilePath | ImageFilePath | VideoFilePath;
/**
 * Declaration merging for fvtt-types
 */
type MHLSettings = {
  "manager-defaults": typeof MHLSettingsManagerDefaults;
  "debug-mode": fields.BooleanField;
  "log-level": fields.StringField<{
    required: true;
    blank: false;
    choices: { debug: string; info: string; warn: string; error: string };
  }>;
};

declare global {
  // eslint-disable-next-line no-var
  var mhl: MHLCore;

  interface AssumeHookRan {
    init: true;
  }
  interface ModuleConfig {
    [MODULE_ID]: { api: MHLCore };
  }
  interface RequiredModules {
    [MODULE_ID]: true;
  }
  interface CONFIG {
    [MODULE_ID]: typeof MHLCONFIG;
  }

  namespace ClientSettings {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-object-type
    interface RegisterOptions<T>
      extends MHLSettingsManager.DefinitionExtensions {}
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface SettingSubmenuConfig
      extends MHLSettingsManager.MenuDefinitionExtensions {}
  }
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface SettingConfig extends WithPrefix<MHLSettings, `${MODULE_ID}.`> {}
}
