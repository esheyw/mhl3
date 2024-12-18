import type { DataField } from "fvtt-types/src/foundry/common/data/fields.d.mts";
import type { Fromable } from "../../mhl.js";
export function isJQuery(element: JQuery | HTMLElement): element is JQuery {
  return element instanceof jQuery;
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

/**
 * Type guard for datafields.
 *
 * @param object      - The object being tested
 * @param targetField - The type of field to check for (default: `foundry.data.fields.DataField`)
 */
export function isDataField(
  object: unknown,
  targetField?: undefined,
): object is DataField.Any;
export function isDataField<Field extends DataField.AnyConstructor>(
  object: unknown,
  targetField: Field,
): object is InstanceType<Field>;
export function isDataField(
  object: unknown,
  targetField: DataField.AnyConstructor = foundry.data.fields.DataField,
): boolean {
  // Why not have runtime null safety? Gonna be muting a lot of eslint at this rate
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  targetField ??= foundry.data.fields.DataField;
  return object instanceof targetField;
}
