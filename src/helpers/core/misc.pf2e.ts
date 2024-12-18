/**
 * Code in this file originally taken from the PF2e System project at https://github.com/foundryvtt/pf2e/ under the Apache 2.0 License
 * Modified slightly to account for its use outside the system context
 * A copy of the license can be found at `licenses/LICENSE.pf2e.txt`
 */

import type { ImageFilePath, VideoFilePath } from "../../mhl.d.ts";

/** Given an object, returns a new object with the same keys, but with each value converted by a function. */
function mapValues<K extends PropertyKey, V, R>(
  object: Record<K, V>,
  mapping: (value: V, key: K) => R,
): Record<K, R> {
  return Object.entries<V>(object).reduce<Record<K, R>>(
    (result, [key, value]) => {
      result[key as K] = mapping(value, key as K);
      return result;
    },
    // TODO: figure out why ESLint says I can remove this, but if I do things blow up
    // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter
    {} as Record<K, R>,
  );
}
/** Does the parameter look like an image file path? */
function isImageFilePath(path: unknown): path is ImageFilePath {
  return typeof path === "string" && ImageHelper.hasImageExtension(path);
}

/** Does the parameter look like a video file path? */
function isVideoFilePath(path: unknown): path is VideoFilePath {
  return typeof path === "string" && VideoHelper.hasVideoExtension(path);
}

function isImageOrVideoPath(
  path: unknown,
): path is ImageFilePath | VideoFilePath {
  return (
    typeof path === "string" &&
    (ImageHelper.hasImageExtension(path) || VideoHelper.hasVideoExtension(path))
  );
}

export { mapValues, isImageFilePath, isImageOrVideoPath, isVideoFilePath };
