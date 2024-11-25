import type {
  MapLike,
  SimpleTestFunction,
  SortCallback,
  StringReplaceCallback,
} from "../mhl.d.ts";
import type {
  AnyFunction,
  AnyObject,
  NullishProps,
  SimpleMerge,
} from "fvtt-types/src/types/utils.d.mts";
import { sluggify, localeSort, nullSort } from "../helpers/string/index.ts";
import * as R from "remeda";
import type { IntentionalPartial } from "fvtt-types/src/types/helperTypes.d.mts";
import { getInvalidKeys } from "../helpers/core/util.ts";
import { filterObject } from "../helpers/core/filterObject.ts";
import { log, type LogOptions } from "../helpers/core/logging.ts";

class MHLSettingsManager {
  #enrichers: Map<string | RegExp, string | StringReplaceCallback> = new Map([
    [/`([^`]+)`/g, `<code>$1</code>`],
    [/\[([^\]]+)\]\(([^\)]+)\)/g, `<a href="$2">$1</a>`],
  ]);
  #groups: Set<string> = new Set();
  #initialized: boolean = false;
  #options: MHLSettingsManager.Options;
  #potentialSettings: Collection<
    ClientSettings.RegisterOptions<any> | ClientSettings.RegisterSubmenu
  > = new Collection();
  #module: Module;
  #resetListener?: EventListener;
  #settings: Collection<
    ClientSettings.RegisterOptions<any> | ClientSettings.RegisterSubmenu
  > = new Collection();

  constructor(modFor: Module, options: MHLSettingsManager.AssignmentOptions) {
    this.#module = modFor;
    this.#options = this.#processOptions(options);
    this.#initialized = true;
  }

  get initialized() {
    return this.#initialized;
  }

  get app(): SettingsConfig | undefined {
    return Object.values(ui.windows).find((w) => w.id === "client-settings") as
      | SettingsConfig
      | undefined;
  }

  get section(): HTMLElement | undefined | null {
    if (!this.app || !this.app.rendered) return;
    const settingsConfigRoot =
      this.app instanceof foundry.applications.api.ApplicationV2
        ? this.app.element
        : this.app.element[0];
    return settingsConfigRoot?.querySelector<HTMLElement>(
      `section[data-category="${this.#module.id}"]`,
    );
  }

  get(key: string) {
    return game.settings.get(
      this.#module.id as ClientSettings.Namespace,
      key as ClientSettings.Key,
    );
  }

  get #defaultOptions(): MHLSettingsManager.Options {
    const prefix = sluggify(this.#module.title, { camel: "bactrian" });
    return {
      associateLabels: true,
      prefix,
      enrichHints: true,
      groups: {
        accordionIndicator: true,
        accordionSpeed: 300,
        animated: false,
        classes: [],
        collapsible: false,
        enabled: true,
        infix: "Group",
        sort: nullSort,
        overrides: {},
      },
      settingPrefix: prefix + ".Setting",
      sort: {
        menusFirst: true,
        fn: nullSort,
      },
      visibility: true,
    };
  }

  #processOptions(
    options: MHLSettingsManager.AssignmentOptions,
  ): MHLSettingsManager.Options {
    const defaults = this.#defaultOptions;
    const processedOptions = {
      prefix: options.prefix ?? defaults.prefix,
      enrichHints: options.enrichHints ?? defaults.enrichHints,
      groups: this.#processGroupsOption(options.groups, defaults.groups),
      settingPrefix: options.settingPrefix ?? defaults.settingPrefix,
      sort: this.#processSortOption(options.sort, defaults.sort),
    };
    return processedOptions;
  }

  #processGroupsOption(
    groupsOption: MHLSettingsManager.AssignmentOptions["groups"],
  ): MHLSettingsManager.Options["groups"] | null {
    const defaults = this.#defaultOptions.groups;
    if (groupsOption === true) {
      // Fall back to defaults
      return defaults;
    }
    if (groupsOption === false) {
      // groups disabled
      return Object.assign(defaults, { enabled: false });
    }
    if (groupsOption === "a") {
      // Sort groups alphabetically
      return Object.assign(defaults, { sort: localeSort });
    }
    if (!R.isPlainObject(groupsOption))
      throw new Error("Malformed groups option");

    // const validators: Record<keyof typeof groupsOption, (testee: unknown) => boolean> = {
    //   accordionIndicator: (v: unknown) => v === true || typeof v === "string",
    //   accordionSpeed: (v: unknown) => typeof v === "number" && Number.isInteger(v) && v > -1 && v < 10000,
    //   animated: (v) => typeof v === "boolean",
    //   classes: (v) =>
    // }
    const proccessedGroupOptions = this.#filterOptionAndLogInvalid(
      groupsOption,
      "groups",
    );
    // const processedGroupOption: MHLSettingsManager.GroupsOptions = {
    //   accordionIndicator:
    //     "accordionIndicator" in groupsOption
    //       ? groupsOption.accordionIndicator === true ||
    //         typeof groupsOption.accordionIndicator === "string"
    //         ? groupsOption.accordionIndicator
    //         : (() => {
    //             this.#logInvalidOptionValue(
    //               "accordionIndicator",
    //               groupsOption.accordionIndicator,
    //               defaults.accordionIndicator,
    //               "groups",
    //             );
    //             return defaults.accordionIndicator;
    //           })()
    //       : defaults.accordionIndicator,
    //   accordionSpeed:
    //     "accordionSpeed" in groupsOption &&
    //     Number.isInteger(groupsOption.accordionSpeed)
    //       ? groupsOption.accordionSpeed
    //       : defaults.accordionSpeed,

    //   enabled:
    //     "enabled" in groupsOption ? !!groupsOption.enabled : defaults.enabled,
    // };

    if (
      "overrides" in groupsOption &&
      R.isPlainObject(groupsOption.overrides)
    ) {
      const validOverrides: Record<
        string,
        Partial<MHLSettingsManager.GroupOverride>
      > = {};
      for (const group in groupsOption.overrides) {
        validOverrides[this.#expandPartialGroupName(group)] = {};
      }
    }
  }

  #processSortOption(
    sortOption: MHLSettingsManager.AssignmentOptions["sort"],
  ): MHLSettingsManager.Options["sort"] | null {
    const defaults = this.#defaultOptions.sort;
    if (sortOption === false) {
      // Fall back to defaults matching core behaviour: Menus first, then registration order
      return defaults;
    }
    if (sortOption === null) {
      // No sorting at all, not even menus first
      return Object.assign(defaults, { menusFirst: false });
    }
    if (sortOption === true || sortOption === "a") {
      // Sort settings alphabetically
      return Object.assign(defaults, { fn: localeSort });
    }
    if (typeof sortOption === "function") {
      // Custom sort function
      return { menusFirst: true, fn: sortOption };
    }
    if (R.isPlainObject(sortOption)) {
      return {
        menusFirst: !!(
          // can't trust user input from JS-land
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          (sortOption.menusFirst ?? defaults.menusFirst)
        ),
        fn: typeof sortOption.fn === "function" ? sortOption.fn : defaults.fn,
      };
    }
    return null;
  }

  #expandPartialGroupName(group: string): string;
  #expandPartialGroupName(group: null): null;
  #expandPartialGroupName(group: string | null): string | null {
    // we know the null group will always exist
    if (group === null) return null;
    // group = this.#logCastString(group, "group", `${funcPrefix}##expandPartialGroupName`);
    if (!group.startsWith(".")) return group;
    return `${this.#options.settingPrefix}${this.#options.groups.infix}${group}`;
  }

  #requireSetting(
    key: string,
    {
      /** Include potential settings in the search? */
      potential = false,
    } = {},
  ) {
    const settingData = this.#settings.has(key)
      ? this.#settings.get(key)
      : potential && this.#potentialSettings.has(key)
        ? this.#potentialSettings.get(key)
        : null;
    if (!settingData) {
      console.error(
        `Setting ${key} is not a currently${potential ? ", nor a potentionally," : ""} registered setting for ${this.#module.title}`,
      );
      return null;
    }
    return settingData;
  }

  #filterOptionAndLogInvalid<
    OptionName extends keyof MHLSettingsManager.OptionsMap,
  >(
    data: AnyObject,
    optionName: OptionName,
    validators: Record<string, SimpleTestFunction> = {},
  ): MHLSettingsManager.OptionsMap[OptionName] {
    const defaults = this.#defaultOptions[optionName];
    const invalidKeys = getInvalidKeys(data, defaults);
    if (invalidKeys.length) this.#logInvalidOptionKeys(invalidKeys, optionName);
    const filtered = filterObject(data, defaults) as Partial<
      MHLSettingsManager.OptionsMap[OptionName]
    >;
    for (const [key, defaultValue] of Object.entries(defaults)) {
      if (!(key in filtered)) {
        // none provided, use default
        filtered[key] = defaultValue;
        continue;
      }
      const inputValue = filtered[key];
      if (validators[key] && !validators[key](inputValue)) {
        // invalid provided, log and use default
        this.#logInvalidOptionValue(key, inputValue, defaultValue, optionName);
        filtered[key] = defaults[key];
      }
    }
    return filtered as MHLSettingsManager.OptionsMap[OptionName];
  }

  #log(loggable: unknown, options: Partial<LogOptions> = {}) {
    const opts = foundry.utils.mergeObject(
      options,
      {
        prefix: this.#module.title,
        context: {
          module: this.#module.title,
        },
      },
      { inplace: false },
    );
    log(loggable, opts);
  }

  #logInvalidOptionData(data: unknown, option: string) {
    this.#log(
      { [option]: data },
      {
        softType: "error",
        text: `MHL.SettingsManager.Error.InvalidOptionData`,
        context: { option },
      },
    );
  }

  #logInvalidOptionKeys(keys: string[], option: string): void {
    this.#log(
      { keys },
      {
        softType: "warn",
        text: `MHL.SettingsManager.Error.InvalidOptionKeys`,
        context: { keys: keys.join(", "), option },
      },
    );
  }

  #logInvalidOptionValue(
    key: string,
    value: unknown,
    defaultValue: unknown,
    option: string,
  ): void {
    this.#log(
      { key, value, default: defaultValue },
      {
        softType: "error",
        text: "MHL.SettingsManager.Error.InvalidOptionValue",
        context: { key, option, default: JSON.stringify(defaultValue) },
      },
    );
  }
}
/**
 * **************************************************************
 * Settings Manager Types
 * **************************************************************
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
namespace MHLSettingsManager {
  /**
   * Manager Options types
   */

  export type OptionsMap = {
    groups: GroupsOptions;
    sort: SortOptions;
    resetButtons: ResetButtonsOptions;
  };

  export type GroupOverride = IntentionalPartial<
    Omit<GroupsOptions, "enabled" | "infix" | "overrides"> & {
      sort: SortOptions;
    }
  >;

  export type GroupsOptions = {
    accordionIndicator: true | string;
    accordionSpeed: number;
    animated: boolean;
    collapsible: boolean;
    enabled: boolean;
    sort: SortCallback;
    classes: string[];
    infix: string;
    overrides?: Record<string, GroupOverride>;
  };

  type SortOptions = {
    menusFirst: boolean;
    fn: SortCallback;
  };

  type ResetButtonsOptions = {
    module: boolean | string;
    group: boolean | string;
    setting: boolean | string;
    disabledClass: boolean | string;
  };

  type HintEnricherData = MapLike<
    string | RegExp,
    string | StringReplaceCallback
  >;

  export type Options = {
    associateLabels: boolean;
    choiceInfix: string;
    enrichHints: boolean;
    groups: GroupsOptions;
    prefix: string;
    resetButtons: ResetButtonsOptions;
    settingPrefix: string;
    sort: SortOptions;
    visibility: boolean;
  };

  export type AssignmentOptions = NullishProps<
    SimpleMerge<
      Options,
      {
        enrichers: HintEnricherData;
        groups:
          | boolean
          | string[]
          | NullishProps<
              SimpleMerge<GroupsOptions, { sort: SortCallback | string[] }>
            >;
        sort: SortOptions | SortCallback | boolean | "a" | null;
      }
    >
  >;

  /**
   * Manager Setting Definition Extentions
   */
  type ButtonData = {
    label?: boolean | string;
    icon?: string;
    action: AnyFunction;
  };

  type VisibilityFunction = (
    form: AnyObject,
    saved: AnyObject,
    visible: boolean,
  ) => boolean;
  type VisibilityData = VisibilityFunction | string[];

  type HooksData = {
    hook: string;
    action: AnyFunction;
    test?: SimpleTestFunction;
  };

  export interface DefinitionExtensions {
    button?: ButtonData;
    hooks?: HooksData;
    group?: string;
    visibility?: VisibilityData;
  }

  export interface MenuDefinitionExtensions {
    group?: string;
  }
}

export default MHLSettingsManager;
