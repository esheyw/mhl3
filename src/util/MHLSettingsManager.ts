import type {
  Fromable,
  SimpleTestFunction,
  SortCallback,
  StringReplaceCallback,
} from "../mhl.d.ts";
import type {
  AnyFunction,
  AnyObject,
  InexactPartial,
} from "fvtt-types/src/types/utils.d.mts";
import { MHLCore } from "../MHLCore.ts";
export class MHLSettingsManager {
  options?: MHLSettingsManagerAssignmentOptions;
  constructor(modID: string, options: MHLSettingsManagerAssignmentOptions) {
    const existing = MHLCore.instance?.settingsManagers.get(modID);
    if (existing) return existing;
    this.options = options;
  }
}
/**
 * **************************************************************
 * Settings Manager Types
 * **************************************************************
 */

/**
 * Manager Options types
 */
type MHLSettingsGroupBaseOptions = {
  accordionIndicator: true | string;
  animated: boolean;
  collapse: boolean;
  sort: SortCallback;
  classes: string[];
};

export type MHLSettingsGroupOptions = MHLSettingsGroupBaseOptions & {
  infix: string;
  overrides?: Record<string, InexactPartial<MHLSettingsGroupBaseOptions>>;
};

type MHLSettingsHintEnricherEntry = [
  string | RegExp,
  string | StringReplaceCallback,
];
type MHLSettingsHintEnricherData =
  | Map<MHLSettingsHintEnricherEntry[0], MHLSettingsHintEnricherEntry[1]>
  | Fromable<MHLSettingsHintEnricherEntry>;

type MHLSettingsManagerBaseOptions = {
  prefix: string;
  associateLabels: boolean;
};

export type MHLSettingsManagerAssignmentOptions =
  InexactPartial<MHLSettingsManagerBaseOptions> & {
    groups?: boolean | string[] | InexactPartial<MHLSettingsGroupOptions>;
    enrichHints?: boolean | MHLSettingsHintEnricherData;
  };

export type MHLSettingsManagerOptions = MHLSettingsManagerBaseOptions & {
  groups: MHLSettingsGroupOptions;
  enrichHints: boolean;
};

/**
 * Manager Setting Definition Extentions
 */
type MHLSettingButtonData = {
  label?: boolean | string;
  icon?: string;
  action: AnyFunction;
};

type MHLSettingVisibilityFunction = (
  form: AnyObject,
  saved: AnyObject,
  visible: boolean,
) => boolean;
type MHLSettingVisibilityData = MHLSettingVisibilityFunction | string[];

type MHLSettingHooksData = {
  hook: string;
  action: AnyFunction;
  test?: SimpleTestFunction;
};

export interface MHLSettingDefinitionExtensions {
  button?: MHLSettingButtonData;
  hooks?: MHLSettingHooksData;
  group?: string;
  visibility?: MHLSettingVisibilityData;
}

export interface MHLSettingMenuDefinitionExtensions {
  group?: string
}