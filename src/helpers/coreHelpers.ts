import type { AnyMutableObject } from "fvtt-types/src/types/utils.d.mts";
import type { Fromable } from "../mhl.js";
import { fu } from "../constants.ts";

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
