/**
 * Code in this file originally taken from the PF2e System project at https://github.com/foundryvtt/pf2e/ under the Apache 2.0 License
 * Modified slightly to account for its use outside the system context
 * A copy of the license can be found at `licenses/LICENSE.pf2e.txt`
 */

import type { SetElement } from "../../mhl.js";

/**
 * Check if a key is present in a given object in a type safe way
 *
 * @param obj - The object to check
 * @param key - The key to check
 */
function objectHasKey<O extends object>(obj: O, key: unknown): key is keyof O {
  return (typeof key === "string" || typeof key === "number") && key in obj;
}

/** Check if a value is present in the provided array. Especially useful for checking against literal tuples */
function tupleHasValue<const A extends readonly unknown[]>(
  array: A,
  value: unknown,
): value is A[number] {
  return array.includes(value);
}

/** Check if an element is present in the provided set. Especially useful for checking against literal sets */
function setHasElement<T extends Set<unknown>>(
  set: T,
  value: unknown,
): value is SetElement<T> {
  return set.has(value);
}

export { objectHasKey, tupleHasValue, setHasElement };
