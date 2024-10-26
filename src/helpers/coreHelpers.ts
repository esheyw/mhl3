import type {
  AnyArray,
  AnyMutableObject,
  AnyObject,
} from "fvtt-types/src/types/utils.d.mts";
import type { CouldBeTrue, Fromable } from "../mhl.d.ts";
import { fu } from "../constants.ts";

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
type CloneableOf<Options extends DeeperCloneOptions> =
  CouldBeTrue<Options["strict"]> extends true
    ? {
        readonly [K: string]: CloneableTypes<Options>;
      }
    : AnyObject;

type CloneableTypes<Options extends DeeperCloneOptions> =
  | (true extends Options["cloneSets"] ? Set<unknown> : never)
  | (true extends Options["cloneMaps"] ? Map<unknown, unknown> : never)
  | { readonly [K: string]: CloneableTypes<Options> } // May whine about recursiveness.
  | CloneableTypes<Options>[]
  | (number | string | boolean | null | undefined); // May be missing some.

type DeeperClone<
  O extends CloneableOf<Options>,
  Options extends DeeperCloneOptions,
> =
  CouldBeTrue<Options["strict"]> extends true
    ? O
    : _DeeperClone<O, CloneableTypes<Options>, Options>;

type _DeeperClone<
  Original,
  CloneableTypes,
  Options extends DeeperCloneOptions,
> = Original extends CloneableTypes
  ? Original extends AnyObject
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
        ? CouldBeTrue<Options["cloneSets"]> extends true
          ? Set<
              CouldBeTrue<Options["cloneSetValues"]> extends true
                ? _DeeperClone<Item, CloneableTypes, Options>
                : Item
            >
          : Original
        : Original extends Map<infer K, infer V>
          ? CouldBeTrue<Options["cloneMaps"]> extends true
            ? Map<
                CouldBeTrue<Options["cloneMapKeys"]> extends true
                  ? _DeeperClone<K, CloneableTypes, Options>
                  : K,
                CouldBeTrue<Options["cloneMapValues"]> extends true
                  ? _DeeperClone<V, CloneableTypes, Options>
                  : never
              >
            : Original
          : CouldBeTrue<Options["returnOriginal"]> extends true | undefined
            ? Original
            : undefined
  : undefined; // in strict mode this branch will never be triggered

export function deeperClone<Original extends CloneableOf<Options>, Options extends DeeperCloneOptions>(
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

function _deeperClone<Original extends CloneableOf<Options>, Options extends DeeperCloneOptions>(
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
    return original.map((o) => _deeperClone(o, options, depth));

  if (original instanceof Set) {
    if (options.cloneSets)
      return original.map((o) =>
        options.cloneSetValues ? _deeperClone(o, options, depth) : o,
      );
    else return original;
  }

  // Maps & Collections
  if (original instanceof Map) {
    if (options.cloneMaps) {
      const out = new original.constructor();
      for (const [k, v] of original.entries())
        out.set(
          options.cloneMapKeys ? _deeperClone(k, options, depth) : k,
          options.cloneMapValues ? _deeperClone(v, options, depth) : v,
        );
      return out;
    } else return original;
  }

  // Dates
  if (original instanceof Date) return new Date(original);

  // Unsupported advanced objects
  if (original.constructor && original.constructor !== Object) {
    //todo: localize
    if (strict) throw new Error("deeperClone cannot clone advanced objects");
    return returnOriginal ? original : undefined;
  }

  // Other objects
  const clone: AnyMutableObject = {};
  for (const k of Object.keys(original)) {
    clone[k] = _deeperClone(original[k], options, depth);
  }
  return clone;
}

/**
 * Expands any string keys containing `.` in the provided object, mutating it.
 * @param object - The object to be expanded
 */
export function expandInPlace(object: AnyMutableObject): AnyMutableObject {
  if (!Object.keys(object).some((k) => k.includes("."))) return object;
  const expanded = fu.expandObject(object);
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
// export function deeperClone(original: )
