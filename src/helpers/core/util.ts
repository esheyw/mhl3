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
