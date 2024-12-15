import { MODULE_ID } from "../../constants.ts";
import { accordionSpeedField } from "../fields/factories.ts";

const fields = foundry.data.fields;

const mhlSettingsManagerDefaultsSchema = {
  disabledClass: new fields.StringField({
    required: true,
    nullable: false,
    initial: "disabled-transparent",
    choices: () => CONFIG[MODULE_ID].disabledClasses,
    group: ".CSS",
  }),
  accordionSpeed: accordionSpeedField(),
  accordionIndicator: new fields.StringField({
    required: true,
    nullable: false,
    initial: "fa-chevron-down",
  }),
  moduleResetIcon: new fields.StringField({
    required: true,
    nullable: false,
    initial: "mdi-reply-all",
  }),
  groupsResetIcon: new fields.StringField({
    required: true,
    nullable: false,
    initial: "mdi-reply",
  }),
  settingsResetIcon: new fields.StringField({
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
