import type { AnyMutableObject } from "fvtt-types/src/types/utils.d.mts";
import { isPlainObject } from "remeda";

/**
 * Expands any string keys containing `.` in the provided object, mutating it.
 * @param object - The object to be expanded
 * @throws If not provided a plain object
 */
export function expandInPlace(object: AnyMutableObject): void {
  //todo: logging error
  if (!isPlainObject(object))
    throw new Error("expandInPlace operates only on plain objects");
  if (!Object.keys(object).some((k) => k.includes("."))) return;
  const expanded = foundry.utils.expandObject(object);
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  Object.keys(object).forEach((k) => delete object[k]);
  Object.assign(object, expanded);
}
