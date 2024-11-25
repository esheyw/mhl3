import type {
  AnyMutableObject,
  AnyObject,
} from "fvtt-types/src/types/utils.d.mts";
import type { Fromable, MapLike, SortCallback } from "../../mhl.d.ts";
import { isFromable } from "./guards.ts";
import * as R from "remeda";

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

export function arrayify<T = never>(fromable: Fromable<T>): Array<T> {
  if (Array.isArray(fromable)) return fromable as Array<T>;
  return Array.from(fromable);
}

export function mapify<K = unknown, V = unknown>(
  input: MapLike<K, V>,
): Map<K, V> {
  if (input instanceof Map) return input;
  if (!isFromable(input)) throw new Error("Invalid entry data");
  return new Map(Array.from(input));
}

/**
 * Takes an array of objects and returns a sort callback that will order an array
 * with `order` first, and in that order, with all values not found in `order` not
 * sorted further.
 * @param  order - An array representing the order to sort to
 * @returns The generated sort callback
 *
 * @example
 * ```js
 * const order = ["b", "f", "a"]
 * const input = ["a", "b", "c", "d", "e", "f"]
 * const sorter = generateSorterFromOrder(order)
 * input.sort(sorter) // ["b", "f", "a", "c", "d", "e"]
 * ```
 */
export function generateSorterFromOrder<T = never>(
  order: T[] | T,
): SortCallback {
  if (!Array.isArray(order)) order = [order];
  order = [...new Set(order)];
  return <TCompare extends T>(a: TCompare, b: TCompare) => {
    const aIdx = order.indexOf(a);
    const bIdx = order.indexOf(b);
    if (aIdx === -1) {
      // a not in order, b is, b goes first
      if (bIdx > -1) return 1;
      // neither in order, so existing order is fine
      return 0;
    } else {
      // both in the order list
      if (bIdx > -1) return aIdx - bIdx;
      // a in order, b isn't, a goes first
      return -1;
    }
  };
}

/**
 * Expands any string keys containing `.` in the provided object, mutating it.
 * @param object - The object to be expanded
 * @throws If not provided a plain object
 */
export function expandInPlace(object: AnyMutableObject): void {
  //todo: logging error
  if (!R.isPlainObject(object))
    throw new Error("expandInPlace operates only on plain objects");
  if (!Object.keys(object).some((k) => k.includes("."))) return;
  const expanded = foundry.utils.expandObject(object);
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  Object.keys(object).forEach((k) => delete object[k]);
  Object.assign(object, expanded);
}

/**
 * Gets all keys from a Record that *are not* in a template object or array of valid string keys.
 * Not recursive.
 * @param source - The object being tested
 * @param valid  - A template object, or a fromable of valid keys
 * @returns  Any keys found in `source` not allowed by `valid`
 */
export function getInvalidKeys(
  source: AnyObject,
  valid: Fromable<string> | AnyObject = [],
) {
  const validKeys = new Set<string>(
    isFromable(valid)
      ? arrayify(valid)
      : R.isPlainObject(valid)
        ? Object.keys(valid)
        : [],
  );
  if (R.isPlainObject(source)) {
    return [...new Set(Object.keys(source)).difference(validKeys)];
  }
  return [];
}

/**
 * Standard wait function
 * @param ms - The time to wait in milliseconds
 */
export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
