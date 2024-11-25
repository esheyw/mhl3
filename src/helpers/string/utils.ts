/**
 * A sort callback that does no sorting
 */
export function nullSort(): number {
  return 0;
}

/**
 * A standard alpha sort that yells at you if you pass it non-strings
 * For use as a `.sort()` callback
 */
export function localeSort(a: string, b: string): number {
  // const func = `localeSort`;
  // a = logCastString(a, "a", { func });
  // b = logCastString(b, "b", { func });
  return a.localeCompare(b);
}
