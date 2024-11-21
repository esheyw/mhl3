import type {
  AnyMutableObject,
  AnyObject,
} from "fvtt-types/src/types/utils.d.mts";
import * as R from "remeda";
import type {
  And,
  CouldBeFalse,
  Extends,
  If,
  KeyIn,
  Or,
  PartialIf,
  PickWithValue,
  UnionToIntersection,
  WithDefault,
} from "../../mhl.js";
import type { GetKey } from "fvtt-types/src/types/helperTypes.d.mts";

interface FilterObjectOptions {
  /** Whether to recursive filter inner objects */
  deletionKeys?: boolean;
  /** Whether to keep deletion keys from the source object in the output */
  templateValues?: boolean;
  /** Whether to set source keys to the associated value from the template or leave existing */
  recursive?: boolean; // Defaults to `true`.
}

interface FilterObjectDefaults extends FilterObjectOptions {
  deletionKeys: false;
  recursive: true;
  templateValues: false;
}

/**
 * FilterObject and associated types courtesy of LukeAbby on the league discord
 */
type _FilterObjectInner<
  Target extends AnyObject,
  Template extends AnyObject,
  Options extends FilterObjectOptions,
  K extends keyof Target,
  IsValidKey extends boolean,
> = false extends IsValidKey
  ? // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    {}
  : PartialIf<
      PickWithValue<
        Target,
        K,
        _FilterObjectRecursion<
          If<
            WithDefault<Options["templateValues"], false>,
            GetKey<Template, K, Target[K]>,
            Target[K]
          >,
          Target[K],
          GetKey<Template, K, Target[K]>,
          Options
        >
      >,
      CouldBeFalse<IsValidKey>
    >;

type _FilterObjectRecursion<
  Inner,
  InnerTarget,
  InnerTemplate,
  Options extends FilterObjectOptions,
> = If<
  And<
    WithDefault<Options["recursive"], true>,
    And<Extends<InnerTarget, AnyObject>, Extends<InnerTemplate, AnyObject>>
  >,
  FilterObject<
    Extract<Inner, AnyObject>,
    Extract<InnerTemplate, AnyObject>,
    Options
  >,
  Inner
>;

export type FilterObject<
  Target extends AnyObject,
  Template extends AnyObject,
  Options extends FilterObjectOptions = FilterObjectDefaults,
> = UnionToIntersection<
  {
    [K in keyof Target]: _FilterObjectInner<
      Target,
      Template,
      Options,
      K,
      Or<
        KeyIn<K, Template>,
        If<
          WithDefault<Options["deletionKeys"], true>,
          Extends<K, `-=${string}`>,
          false
        >
      >
    >;
  }[keyof Target]
>;

/**
 * Filter a source object's keys by those of a template
 *
 * @param source         - Source object
 * @param template       - Template object
 * @param recursive      - Whether to recursive filter inner objects
 * @param deletionKeys   - Whether to keep deletion keys from the source object in the output
 * @param templateValues - Whether to set source keys to the associated value from the template or leave existing
 * @returns - The filtered object
 */
export function filterObject<
  Target extends AnyObject,
  Template extends AnyObject,
  Options extends FilterObjectOptions = FilterObjectDefaults,
>(
  source: Target,
  template: Template,
  {
    recursive = true,
    deletionKeys = false,
    templateValues = false,
  }: FilterObjectOptions = {},
): FilterObject<Target, Template, Options> {
  if (!R.isPlainObject(source) || !R.isPlainObject(template))
    throw new Error(
      "filterObject | Both source and template must be plain objects.",
    );

  const options: FilterObjectOptions = {
    recursive,
    deletionKeys,
    templateValues,
  };
  return _filterObject(source, template, {}, options) as FilterObject<
    Target,
    Template,
    Options
  >;
}

function _filterObject(
  source: AnyObject,
  template: AnyObject,
  filtered: AnyMutableObject,
  options: FilterObjectOptions,
): AnyObject {
  for (const [key, value] of Object.entries(source)) {
    const existsInTemplate = Object.prototype.hasOwnProperty.call(
      template,
      key,
    );
    const templateValue = template[key];
    if (existsInTemplate) {
      if (R.isPlainObject(value) && R.isPlainObject(templateValue)) {
        filtered[key] = options.recursive
          ? _filterObject(value, templateValue, filtered, options)
          : value;
      } else {
        filtered[key] = options.templateValues ? templateValue : value;
      }
    } else if (options.deletionKeys && key.startsWith("-=")) {
      //should be keepDeletionKeys but we're matching the foundry API
      filtered[key] = value;
    }
  }
  return filtered;
}
