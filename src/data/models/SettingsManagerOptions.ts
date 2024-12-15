import { localeSort, nullSort, sluggify } from "../../helpers/string/index.ts";
import { FunctionField } from "../fields/FunctionField.ts";
import type DataModel from "fvtt-types/src/foundry/common/abstract/data.d.mts";
import MHLSettingsManager from "../../util/MHLSettingsManager.ts";
import {
  objectHasKey,
  tupleHasValue,
} from "../../helpers/core/narrowing.pf2e.ts";
import { isFromable } from "../../helpers/core/guards.ts";
import { generateSorterFromOrder } from "../../helpers/core/util.ts";
import type { SchemaField } from "fvtt-types/src/foundry/common/data/fields.d.mts";
import * as R from "remeda";
import { ModuleField } from "../fields/ModuleField.ts";
import { isModule } from "../../helpers/foundry/guards.ts";
import { accordionSpeedField } from "../fields/factories.ts";
const fields = foundry.data.fields;

/**
 * sort Option
 */

const sortOptionSchema = {
  menusFirst: new fields.BooleanField({ initial: true }),
  fn: new FunctionField({ required: true, initial: nullSort }),
};

/**
 * groups Option
 */

/** Generator for the parts of the schema that `groups` shares with `groups.overrides` */
const GroupBaseSchema = (required: boolean) => ({
  accordionIndicator: new fields.StringField({
    required,
    nullable: true,
    blank: false,
    initial: null,
  }),
  accordionSpeed: accordionSpeedField(required),
  animated: new fields.BooleanField({
    required,
  }),
  collapsible: new fields.BooleanField({
    required,
  }),
  classes: new fields.SetField(
    new fields.StringField({
      required: true,
      blank: false,
    }),
    {
      required,
    },
  ),
});

const groupsOptionSchema = {
  ...GroupBaseSchema(true),
  enabled: new fields.BooleanField({
    initial: true,
  }),
  infix: new fields.StringField({
    required: true,
    blank: false,
    initial: "Group",
  }),
  overrides: new fields.ArrayField(
    new fields.SchemaField({
      group: new fields.StringField({
        required: true,
        blank: false,
      }),
      ...GroupBaseSchema(false),
      sort: new fields.SchemaField(sortOptionSchema),
    }),
  ),
  sort: new FunctionField({ required: true, initial: nullSort }),
};

/**
 * resetButton Option
 */
const resetButtonField = () =>
  new fields.StringField({
    blank: false,
    nullable: true,
    required: false,
    initial: null,
  });
const resetButtonOptionSchema = {
  module: resetButtonField(),
  groups: resetButtonField(),
  settings: resetButtonField(),
  disabledClass: resetButtonField(),
};

/**
 * Main Options
 */

function moduleTitleFromAssignmentData(data: unknown): string {
  if (!R.isPlainObject(data)) throw new Error("Source data must be an object");
  const id = R.isString(data.module)
    ? data.module
    : isModule(data.module)
      ? data.module.id
      : null;
  if (!id)
    throw new Error(
      "Must provide `module` key containing an ID or Module instance with Settings Manager options",
    );
  const mod = game.modules.get(id);
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!mod) throw new Error(`Module ${id} not found.`);
  return mod.title;
}

const mhlSettingsManagerOptionsSchema = {
  associateLabels: new fields.BooleanField(),
  choiceInfix: new fields.StringField({
    blank: false,
    required: true,
    initial: "Choice",
  }),
  enrichHints: new fields.BooleanField({ initial: true }),
  groups: new fields.SchemaField(groupsOptionSchema),
  module: new ModuleField({ nullable: false }),
  prefix: new fields.StringField({
    blank: false,
    required: true,
    //TODO: can this be Partial<ThisSchema> without breaking things? probably not
    initial: (data: unknown) =>
      sluggify(moduleTitleFromAssignmentData(data), { camel: "bactrian" }),
  }),
  resetButtons: new fields.SchemaField(resetButtonOptionSchema),
  settingsPrefix: new fields.StringField({
    required: true,
    blank: false,
    initial: (data: unknown) =>
      sluggify(moduleTitleFromAssignmentData(data), { camel: "bactrian" }) +
      ".Setting",
  }),
  sort: new fields.SchemaField(sortOptionSchema),
  visibility: new fields.BooleanField(),
};

type MHLSettingsManagerOptionsSchema = typeof mhlSettingsManagerOptionsSchema;

export class MHLSettingsManagerOptions extends foundry.abstract
  .DataModel<MHLSettingsManagerOptionsSchema> {
  constructor(
    data: MHLSettingsManager.AssignmentOptions,
    options?: DataModel.ConstructorOptions,
  ) {
    super(
      data as DataModel.ConstructorData<MHLSettingsManagerOptionsSchema>,
      options,
    );
  }

  static override LOCALIZATION_PREFIXES = [`MHL.Models.${this.name}`];

  static override defineSchema(): MHLSettingsManagerOptionsSchema {
    return mhlSettingsManagerOptionsSchema;
  }

  static override cleanData(
    source: MHLSettingsManager.AssignmentOptions,
    options: Parameters<SchemaField.Any["clean"]>[1],
  ): DataModel.ConstructorData<MHLSettingsManagerOptionsSchema> {
    if (objectHasKey(source, "groups")) {
      this.#cleanSourceGroupsData(source);
    }
    if (objectHasKey(source, "resetButtons")) {
      this.#cleanResetButtonData(source);
    }
    if (objectHasKey(source, "sort")) {
      this.#cleanSourceSortData(source);
    }
    return super.cleanData(source, options);
  }

  static #cleanResetButtonData(source: MHLSettingsManager.AssignmentOptions) {
    const resetButtons = source.resetButtons;
    // falsey: no reset buttons: "" means disabled
    if (!resetButtons)
      return void (source.resetButtons = {
        module: "",
        groups: "",
        settings: "",
      });
    // use default icons/class (fields will initialize to `null`)
    if (resetButtons === true) return void (source.resetButtons = {});
    // invalid, bail
    if (!R.isPlainObject(resetButtons)) return;
    let key: keyof typeof resetButtons;
    for (key in resetButtons) {
      if (!resetButtons[key]) resetButtons[key] = "";
      if (resetButtons[key] === true) resetButtons[key] = null;
    }
  }

  static #cleanSourceSortData(source: {
    sort?: MHLSettingsManager.AssignmentOptions["sort"];
  }): void {
    const sort = source.sort;
    // false means no changes from core: Menus first, settings in registration order
    if (sort === false) {
      return void (source.sort = {});
    }
    // null removes even core's "sorting" of having the menus first
    if (sort === null) {
      return void (source.sort = { menusFirst: false });
    }
    // shorthand for "Menus first, regular settings alphabetical"
    if (tupleHasValue(["a", true], sort)) {
      return void (source.sort = { fn: localeSort });
    }
    // user-provided sort function
    if (typeof sort === "function") {
      return void (source.sort = { fn: sort });
    }
  }

  static #cleanSourceGroupsData(
    source: MHLSettingsManager.AssignmentOptions,
  ): void {
    const groups = source.groups;
    // Disabled
    if (groups === false) return void (source.groups = { enabled: false });
    // Defaults, but alpha sort
    if (groups === "a") return void (source.groups = { sort: localeSort });
    // Just defaults
    if (tupleHasValue([null, undefined, true], groups))
      return void (source.groups = {});
    // if it's not an object at this point it's trash, pass to the model to error
    if (!R.isPlainObject(groups)) return;

    if (objectHasKey(groups, "sort")) this.#cleanGroupsSortData(groups);
    if (objectHasKey(groups, "overrides"))
      this.#cleanGroupsOverridesData(groups);
  }

  static #cleanGroupsOverridesData(
    groups: Exclude<
      MHLSettingsManager.AssignmentOptions["groups"],
      null | undefined | boolean | "a" | string[]
    >,
  ): void {
    if (!isFromable(groups.overrides)) return;
    const overrides = Array.from(groups.overrides);
    for (const override of overrides) {
      if (objectHasKey(override, "sort")) this.#cleanSourceSortData(override);
    }
    groups.overrides = overrides;
  }
  static #cleanGroupsSortData(
    groups: Exclude<
      MHLSettingsManager.AssignmentOptions["groups"],
      null | undefined | boolean | "a" | string[]
    >,
  ) {
    const sort = groups.sort;
    if (!sort) return void (groups.sort = nullSort);
    if (tupleHasValue(["a", true], sort))
      return void (groups.sort = localeSort);
    if (isFromable(groups.sort))
      return void (groups.sort = generateSorterFromOrder(
        Array.from(groups.sort),
      ));
  }
}
