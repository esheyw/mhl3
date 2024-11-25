import { sluggify } from "../../helpers/string/index.ts";
import * as R from "remeda";
import type { SchemaField } from "fvtt-types/src/foundry/common/data/fields.d.mts";

const fields = foundry.data.fields;

/**
 * Group Options
 */
const GroupBaseSchema = (required: boolean) => ({
  accordionIndicator: new fields.StringField({
    required,
    nullable: true,
    blank: false,
    initial: null,
  }),
  accordionSpeed: new fields.NumberField({
    required,
    nullable: false,
    integer: true,
    positive: true,
    min: 100,
    step: 50,
    max: 10_000,
    initial: 350,
  }),
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
const GroupOptionsSchema = {
  ...GroupBaseSchema(true),
  enabled: new fields.BooleanField({
    initial: true,
  }),
  infix: new fields.StringField({
    required: true,
    blank: false,
    initial: "Group",
  }),
};

/**
 * Sort Options
 */
const SortOptionsSchema = {
  menusFirst: new fields.BooleanField(),
  fn: new fields.StringField(),
};

type SortOptionsSchema = typeof SortOptionsSchema;

export class SortOptionsData extends foundry.abstract
  .DataModel<SortOptionsSchema> {
  static override defineSchema(): SortOptionsSchema {
    return SortOptionsSchema;
  }
}

/**
 * Main Options
 */

const mhlSettingsManagerOptionsSchema = {
  associateLabels: new fields.BooleanField(),
  choiceInfix: new fields.StringField({
    blank: false,
    required: true,
  }),
  moduleID: new fields.StringField({ required: true, blank: false }),
  enrichHints: new fields.BooleanField(),
  prefix: new fields.StringField({
    blank: false,
    required: true,
    //TODO: can this be Partial<ThisSchema> without breaking things? probably not
    initial: (data: unknown) => {
      if (!R.isPlainObject(data) || !R.isString(data.moduleID))
        throw new Error("Must provide Module ID with Settings Manager options");
      return sluggify(data.moduleID, { camel: "bactrian" });
    },
  }),
  settingsPrefix: new fields.StringField({
    required: true,
    blank: false,
    initial: (data: unknown) => {
      if (!R.isPlainObject(data) || !R.isString(data.moduleID))
        throw new Error("Must provide Module ID with Settings Manager options");
      return sluggify(data.moduleID, { camel: "bactrian" }) + ".Setting";
    },
  }),
  sort: new fields.EmbeddedDataField(SortOptionsData),
  visibility: new fields.BooleanField(),
};

export type MHLSettingsManagerOptionsSchema =
  typeof mhlSettingsManagerOptionsSchema;

export class MHLSettingsManagerOptionsData extends foundry.abstract
  .DataModel<MHLSettingsManagerOptionsSchema> {
  constructor(
    data: DataModel.ConstructorData<MHLSettingsManagerOptionsSchema>,
    options?: DataModel.ConstructorOptions,
  ) {
    MHLSettingsManagerOptionsData.cleanData(data);
    super(data, options);
  }
  static override LOCALIZATION_PREFIXES = [`MHL.Models.${this.name}`];

  static override defineSchema(): MHLSettingsManagerOptionsSchema {
    return mhlSettingsManagerOptionsSchema;
  }

  static override cleanData(
    source: DataModel.ConstructorData<MHLSettingsManagerOptionsSchema>,
    options?: Parameters<SchemaField.Any["clean"]>[1],
  ): DataModel.ConstructorData<MHLSettingsManagerOptionsSchema> {
    return super.cleanData(source, options);
  }
}
