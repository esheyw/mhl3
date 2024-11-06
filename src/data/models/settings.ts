import { MODULE_ID } from "../../constants.ts";

const fields = foundry.data.fields;

const mhlSettingsManagerDefaultsSchema = {
  disabledClass: new fields.StringField({
    required: true,
    nullable: false,
    initial: "disabled-transparent",
    choices: () => CONFIG[MODULE_ID].disabledClasses,
    group: ".CSS",
  }),
  accordionSpeed: new fields.NumberField({
    required: true,
    nullable: false,
    min: 25,
    step: 25,
    max: 2000,
    initial: 300,
  }),
  accordionIndicatorIcon: new fields.StringField({
    required: true,
    nullable: false,
    initial: "fa-chevron-down",
  }),
  moduleResetIcon: new fields.StringField({
    required: true,
    nullable: false,
    initial: "mdi-reply-all",
  }),
  groupResetIcon: new fields.StringField({
    required: true,
    nullable: false,
    initial: "mdi-reply",
  }),
  settingResetIcon: new fields.StringField({
    required: true,
    nullable: false,
    initial: "mdi-restore",
  }),
};
export type MHLSettingsManagerDefaultsSchema =
  typeof mhlSettingsManagerDefaultsSchema;
export class MHLSettingsManagerDefaults extends foundry.abstract
  .DataModel<MHLSettingsManagerDefaultsSchema> {
  static override LOCALIZATION_PREFIXES = [`MHL.Models.${this.name}`];
  static override defineSchema(): MHLSettingsManagerDefaultsSchema {
    return mhlSettingsManagerDefaultsSchema;
  }
}
