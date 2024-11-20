import type DataModel from "fvtt-types/src/foundry/common/abstract/data.d.mts";
import type { InexactPartial } from "fvtt-types/src/types/utils.d.mts";

export function generateFieldI18nKeys(
  model: DataModel.AnyConstructor,
  {
    prefixes,
    prefixPath,
  }: InexactPartial<{
    /**
     * An array of localization key prefixes to use. If not specified, prefixes
     * are learned from the DataModel.LOCALIZATION_PREFIXES static property.
     */
    prefixes: string[];

    /**
     * A localization path prefix used to prefix all field names within this model. This is generally not required.
     */
    prefixPath: string;
  }> = {},
): void {
  if (!game.i18n) throw new Error("Cannot localize data model before i18nInit");
  prefixes ||= model.LOCALIZATION_PREFIXES;
  const rules = _getRules(prefixes);
  model.schema.apply(function () {
    // Inner models may have prefixes which take precedence
    if (this instanceof foundry.data.fields.EmbeddedDataField) {
      const model = this.model as DataModel.AnyConstructor;
      if (model.LOCALIZATION_PREFIXES.length) {
        foundry.utils.setProperty(
          rules,
          this.fieldPath,
          _getRules(model.LOCALIZATION_PREFIXES),
        );
      }
    }

    // Localize model fields
    let k = this.fieldPath;
    if (prefixPath) k = k.replace(prefixPath, "");
    const field = foundry.utils.getProperty(rules, k) as {
      label?: string;
      hint?: string;
    };
    if (field.label) this.label = field.label;
    if (field.hint) this.hint = field.hint;
  }, false);
}

function _getRules(prefixes: string[]): Record<string, string> {
  if (!game.i18n) throw new Error("Cannot localize data model before i18nInit");
  const rules = {};
  for (const prefix of prefixes) {
    if (game.i18n.lang !== "en") {
      const fallback = foundry.utils.getProperty(
        //@ts-expect-error gotta access a "protected" property
        game.i18n._fallback,
        `${prefix}.FIELDS`,
      ) as string;
      Object.assign(rules, fallback);
    }
    Object.assign(
      rules,
      foundry.utils.getProperty(game.i18n.translations, `${prefix}.FIELDS`),
    );
  }
  return rules;
}
