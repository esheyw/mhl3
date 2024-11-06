import type {
  AnyArray,
  AnyFunction,
  AnyMutableObject,
  AnyObject,
} from "fvtt-types/src/types/utils.d.mts";
import type { CouldBeTrue, Fromable, WithDefaults } from "../mhl.d.ts";
import * as R from "remeda";

const { expandObject } = foundry.utils;

export type DeeperCloneOptions = {
  /** Throw an Error if deeperClone is unable to clone something instead of returning the original */
  strict?: boolean;
  /* Whether to pass along the reference to an uncloneable complex object, or replace with undefined */
  returnOriginal?: boolean;
  /* Whether to clone Sets or pass along the original reference */
  cloneSets?: boolean;
  /* Whether to clone Set values, or pass along the original reference. Does nothing if cloneSets is false */
  cloneSetValues?: boolean;
  /* Whether to clone Maps/Collections or pass along the original reference */
  cloneMaps?: boolean;
  /* Whether to clone Map/Collection keys, or pass along the original reference. Does nothing if cloneMaps is false */
  cloneMapKeys?: boolean;
  /* Whether to clone Map/Collection values, or pass along the original reference. Does nothing if cloneMaps is false */
  cloneMapValues?: boolean;
};

type CloneableTypesFor<Options extends DeeperCloneOptions> =
  CouldBeTrue<Options["strict"]> extends true
    ? _CloneableTypesFor<Options>
    : unknown;

type _CloneableTypesFor<Options extends DeeperCloneOptions> =
  | (true extends Options["cloneSets"] ? Set<unknown> : never)
  | (true extends Options["cloneMaps"] ? Map<unknown, unknown> : never)
  | { readonly [K: string]: _CloneableTypesFor<Options> }
  | _CloneableTypesFor<Options>[]
  | (number | string | boolean | AnyFunction | null | undefined);

type DeeperClone<
  Original extends CloneableTypesFor<Options>,
  Options extends DeeperCloneOptions,
> =
  CouldBeTrue<Options["strict"]> extends true
    ? Original
    : _DeeperClone<Original, CloneableTypesFor<Options>, Options>;

type _DeeperClone<
  Original,
  CloneableTypes,
  Options extends DeeperCloneOptions,
> = Original extends CloneableTypes
  ? Original extends Date
    ? Date
    : Original extends AnyObject
      ? {
          [K in keyof Original]: _DeeperClone<
            Original[K],
            CloneableTypes,
            Options
          >;
        }
      : Original extends AnyArray
        ? {
            [K in keyof Original & (number | `${number}`)]: _DeeperClone<
              Original[K],
              CloneableTypes,
              Options
            >;
          }
        : Original extends Set<infer Item>
          ? Set<
              CouldBeTrue<Options["cloneSetValues"]> extends true
                ? _DeeperClone<Item, CloneableTypes, Options>
                : Item
            >
          : Original extends Map<infer K, infer V>
            ? Map<
                CouldBeTrue<Options["cloneMapKeys"]> extends true
                  ? _DeeperClone<K, CloneableTypes, Options>
                  : K,
                CouldBeTrue<Options["cloneMapValues"]> extends true
                  ? _DeeperClone<V, CloneableTypes, Options>
                  : never
              >
            : CouldBeTrue<Options["returnOriginal"]> extends true | undefined
              ? Original
              : undefined
  : undefined; // in strict mode this branch will never be triggered

export function deeperClone<
  Original extends CloneableTypesFor<Options>,
  Options extends DeeperCloneOptions,
>(
  original: Original,
  {
    strict = false,
    returnOriginal = true,
    cloneSets = true,
    cloneSetValues = false,
    cloneMaps = false,
    cloneMapKeys = false,
    cloneMapValues = false,
  }: DeeperCloneOptions = {},
): DeeperClone<Original, Options> {
  const options: DeeperCloneOptions = {
    strict,
    returnOriginal,
    cloneSets,
    cloneSetValues,
    cloneMaps,
    cloneMapKeys,
    cloneMapValues,
  };
  return _deeperClone(original, options, 0);
}

function _deeperClone<
  Original extends CloneableTypesFor<Options>,
  Options extends DeeperCloneOptions,
>(
  original: Original,
  options: DeeperCloneOptions,
  depth: number,
): DeeperClone<Original, Options> {
  if (depth > 100) {
    throw new Error(
      "Maximum depth exceeded. Be sure your object does not contain cyclical data structures.",
    );
  }
  depth++;

  // Simple types
  if (typeof original !== "object" || original === null) return original;

  // Arrays and their elements always get cloned as per Foundry's handling
  if (Array.isArray(original))
    return original.map(
      (el) =>
        _deeperClone(el, options, depth) as DeeperClone<Original, Options>,
    ) as unknown as DeeperClone<Original, Options>;

  if (original instanceof Set) {
    if (options.cloneSets)
      return original.map((el) =>
        options.cloneSetValues
          ? (_deeperClone(el, options, depth) as DeeperClone<Original, Options>)
          : (el as DeeperClone<Original, Options>),
      ) as DeeperClone<Original, Options>;
    else return original;
  }

  // Maps & Collections
  if (original instanceof Map) {
    if (options.cloneMaps) {
      const out = new (original.constructor as MapConstructor)();
      for (const [k, v] of original.entries())
        out.set(
          options.cloneMapKeys ? _deeperClone(k, options, depth) : k,
          options.cloneMapValues ? _deeperClone(v, options, depth) : v,
        );
      return out as DeeperClone<Original, Options>;
    } else return original;
  }

  // Dates
  if (original instanceof Date)
    return new Date(original) as DeeperClone<Original, Options>;

  // Unsupported advanced objects
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (original.constructor && original.constructor !== Object) {
    if (options.strict)
      throw new Error("deeperClone cannot clone advanced objects");
    return options.returnOriginal
      ? original
      : (undefined as DeeperClone<Original, Options>);
  }

  // Other objects
  const clone: AnyMutableObject = {};
  for (const k of Object.keys(original)) {
    clone[k] = _deeperClone(
      original[k as never], // effectively casts to unknown, check here if breakage experienced
      options,
      depth,
    );
  }
  return clone as DeeperClone<Original, Options>;
}

export function mhlClone<
  Original extends CloneableTypesFor<
    WithDefaults<Options, { cloneSets: true }>
  >,
  Options extends DeeperCloneOptions,
>(
  original: Original,
  options: DeeperCloneOptions = {},
): DeeperClone<Original, WithDefaults<Options, { cloneSets: true }>> {
  options.cloneSets ??= true;
  return _deeperClone(original, options, 0);
}

/**
 * Expands any string keys containing `.` in the provided object, mutating it.
 * @param object - The object to be expanded
 */
export function expandInPlace(object: AnyMutableObject): AnyMutableObject {
  //todo: logging error
  //todo: Work out ExpandedMutable type
  if (!R.isPlainObject(object))
    throw new Error("expandInPlace operates only on plain objects");
  if (!Object.keys(object).some((k) => k.includes("."))) return object;
  const expanded = expandObject(object);
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  Object.keys(object).forEach((k) => delete object[k]);
  Object.assign(object, expanded);
  return object;
}
/**
 * Tests whether a given object is a non-string iterable
 * @param object          - The object being tested
 */
export function isIterable(object: unknown): object is Iterable<unknown> {
  if (!object || typeof object !== "object") return false;
  return (
    Symbol.iterator in object && typeof object[Symbol.iterator] === "function"
  );
}

/**
 * Tests whether a given object is Array-like (has a length property, and integer keys matching that length)
 * @param object - The object being tested
 */
export function isArrayLike(object: unknown): object is ArrayLike<unknown> {
  return (
    Array.isArray(object) ||
    (!!object &&
      typeof object === "object" &&
      "length" in object &&
      typeof object.length === "number" &&
      (object.length === 0 ||
        (object.length > 0 && object.length - 1 in object)))
  );
}

/**
 * Tests whether a given object is sufficiently Arrayish to pass to Array.from()
 * @param object - The object being tested
 */
export function isFromable(object: unknown): object is Fromable<unknown> {
  return isArrayLike(object) || isIterable(object);
}

/**
 * Check if all values of a provided fromable have the same `typeof`
 * @param fromable - The object being tested
 */
export function isSingleType(fromable: Fromable<unknown>): boolean {
  return new Set(Array.from(fromable, (e) => typeof e)).size === 1;
}

type FilterObjectOptions = {
  /** Whether to recursive filter inner objects */
  recursive?: boolean;
  /** Whether to keep deletion keys from the source object in the output */
  deletionKeys?: boolean;
  /** Whether to set source keys to the associated value from the template or leave existing */
  templateValues?: boolean;
};

type FilteredObject<
  Source extends AnyObject,
  Template extends AnyObject,
  Options extends FilterObjectOptions,
> = {
  readonly [K in keyof Template]: CouldBeTrue<Options["recursive"]> extends true | undefined ? FilteredObject<Source[K], Template, Options> : 
};
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
export function filterObject(
  source: AnyObject,
  template: AnyObject,
  {
    /**
     * Whether to recursive filter inner objects
     * @defaultValue `true`
     */
    recursive = true,
    deletionKeys = false,
    templateValues = false,
  }: FilterObjectOptions = {},
): AnyObject {
  if (!R.isPlainObject(source) || !R.isPlainObject(template))
    throw new Error(
      "filterObject | Both source and template must be plain objects.",
    );

  const options: FilterObjectOptions = {
    recursive,
    deletionKeys,
    templateValues,
  };
  return _filterObject(source, template, {}, options);
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
/**
 * Function that returns its first parameter.
 * For simplifying applying-optional-maps logic.
 * @param self - Any value
 * @returns That value
 *
 * @example
 * Split can be null, in which case we want to do nothing to the elements,
 * but breaking up the chained functions would be unsightly
 *
 * ```js
 * split = split === null ? _i : (i) => i.split(split);
 * inputs = inputs
 *   .flat(Infinity)
 *   .filter((i) => !isEmpty(i))
 *   .flatMap(split)
 * ```
 */
export function _i<T>(self: T): T {
  return self;
}
