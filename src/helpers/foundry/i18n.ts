import type DataModel from "fvtt-types/src/foundry/common/abstract/data.d.mts";
import type { DataField } from "fvtt-types/src/foundry/common/data/fields.d.mts";
import type {
  InexactPartial,
  NullishProps,
} from "fvtt-types/src/types/utils.d.mts";
import * as R from "remeda";
import { MODULE_ID } from "../../constants.ts";

type ValidLocalizationTransforms =
  | "normalize"
  | "toLocaleLowerCase"
  | "toLocaleUpperCase"
  | "toLowerCase"
  | "toUpperCase"
  | "toWellFormed"
  | "trim"
  | "trimEnd"
  | "trimStart"
  | "capitalize"
  | "titleCase"
  | "stripScripts";

export type LocalizationContext = {
  [key: string]:
    | string
    | {
        key: string;
        transform?: ValidLocalizationTransforms;
        context?: LocalizationContext;
      };
};

export type LocalizeOptions = {
  /**
   * Whether context keys whose values are simple strings should also be localized
   * You can always forse localization by providing a LocalizationContext instead of a string value
   */
  recursive: boolean;
  /**
   * Whether placeholders without data passed should resolve to `""` (`true`) or `"undefined"` (foundry's behaviour)
   */
  defaultEmpty: boolean;
};

/**
 * Wraps game.i18n.format with extra options and reduced restrictions.
 * Localization is recursive through the context object by default,
 * and translation values that contain curly braces are supported via
 * escaping them (e.g `"\{This} is not a variable resolution but {this} is"`)
 *
 * @param  key - The top level string to attempt localization of
 * @param context -  Data required to format the provided key. May be recurisve
 * @param options - Additional localization options
 * @returns The localized value, or the original string if no matching key was found
 *
 * @example
 * A recursive context structure. `package` is treated as its own localization call regardless of `recursive`.
 * `optionalClause` will only be localized if `recursive` is `true`. `registered` will check if `transform` is
 * the name of an instance method on Strings and call it if so.
 *
 * ```
 * {
 *   settingName: setting.name,
 *   optionalClause: "MHL.Localization.Key",
 *   registered: {
 *     key: "MHL.Registered" // "Registered",
 *     transform: "toLocaleLowercase"
 *   }
 *   package: {
 *     key: "MHL.Localization.Key2",
 *     context: {
 *       packageType: "module",
 *       packageName: module.title
 *     }
 *   }
 * }
 * ```
 */
export function localize(
  key: string,
  context: LocalizationContext = {},
  { recursive = true, defaultEmpty = true }: NullishProps<LocalizeOptions> = {},
): string {
  if (!key) return "";
  key = String(key);
  if (!game.i18n || R.isEmpty(game.i18n.translations)) {
    //todo: change to return "" and log
    return `Localization attempted before i18n initialization, pasteable command: \n
    game.modules.get('${MODULE_ID}').api.localize('${key}', ${JSON.stringify(context)}, ${JSON.stringify(
      {
        recursive,
        defaultEmpty,
      },
    )})`;
  }
  const processedContext: Record<string, string> =
    R.isEmpty(context) || !R.isPlainObject(context)
      ? {}
      : Object.entries(context).reduce((processed, [k, v]) => {
          let value: string;
          if (typeof k !== "string")
            throw new Error("Malformed localization context");
          if (typeof v === "string") {
            value = recursive ? localize(v) : v;
          } else if (R.isPlainObject(v) && typeof v.key === "string") {
            value = localize(v.key, v.context ?? {}, {
              recursive,
              defaultEmpty,
            });
            if (v.transform && typeof value[v.transform] === "function") {
              value = (value[v.transform] as (...args: never[]) => string)();
            }
          } else {
            throw new Error("Malformed localization context");
          }
          Object.assign(processed, { k: value });
          // processed[k] = value;
          return processed;
        }, {});
  return (
    game.i18n
      .localize(key)
      // match all {} not preceded by \
      .replace(/(?<!\\)({[^}]+})/g, (match): string => {
        const withoutCurlies = match.slice(1, -1);
        const replacement =
          withoutCurlies in processedContext
            ? processedContext[withoutCurlies]
            : null;
        return replacement ?? (defaultEmpty ? "" : String(undefined));
      })
      //strip \ before { from final string
      .replace(/\\{/, "{")
  );
}

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
  model.schema.apply(function (this: DataField.Any) {
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