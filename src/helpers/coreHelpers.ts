import type { AnyMutableObject } from "fvtt-types/src/types/utils.d.mts";
import type { Fromable } from "../mhl.js";
import { fu } from "../constants.ts";

// export type DeeperCloneOptions = {

// }
// export function deeperClone(
//   original: unknown,
//   options: {
//     strict = false,
//     returnOriginal = true,
//     cloneSets = true,
//     cloneSetValues = false,
//     cloneMaps = false,
//     cloneMapKeys = false,
//     cloneMapValues = false,
//   } = {}
// ) {
//   const options = { strict, returnOriginal, cloneSets, cloneSetValues, cloneMaps, cloneMapKeys, cloneMapValues };
//   return _deeperClone(original, options, 0);
// }

// function _deeperClone(original, options, depth) {  
//   if (depth > 100) {
//     throw new Error("Maximum depth exceeded. Be sure your object does not contain cyclical data structures.");
//   }
//   depth++;

//   // Simple types
//   if (typeof original !== "object" || original === null) return original;

//   // Arrays and their elements always get cloned as per Foundry's handling
//   if (original instanceof Array) return original.map((o) => _deeperClone(o, options, depth));

//   if (original instanceof Set) {
//     if (options.cloneSets) return original.map((o) => (options.cloneSetValues ? _deeperClone(o, options, depth) : o));
//     else return original;
//   }

//   // Maps & Collections
//   if (original instanceof Map) {
//     if (options.cloneMaps) {
//       const out = new original.constructor();
//       for (const [k, v] of original.entries())
//         out.set(
//           options.cloneMapKeys ? _deeperClone(k, options, depth) : k,
//           options.cloneMapValues ? _deeperClone(v, options, depth) : v
//         );
//       return out;
//     } else return original;
//   }
  
//   // Dates
//   if (original instanceof Date) return new Date(original);

//   // Unsupported advanced objects
//   if (original.constructor && original.constructor !== Object) {
//     //todo: localize
//     if (strict) throw new Error("deeperClone cannot clone advanced objects");
//     return returnOriginal ? original : undefined;
//   }

//   // Other objects
//   const clone = {};
//   for (const k of Object.keys(original)) {
//     clone[k] = _deeperClone(original[k], options, depth);
//   }
//   return clone;
// }

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
