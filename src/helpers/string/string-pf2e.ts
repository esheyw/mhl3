/**
 * Code in this file originally taken from the PF2e System project at https://github.com/foundryvtt/pf2e/ under the Apache 2.0 License
 * Modified slightly to account for its use outside the system context
 * A copy of the license can be found at `licenses/LICENSE.pf2e.txt`
 */

import { MHLCore } from "../../MHLCore.ts";

/**
 * Return an integer string of a number, always with sign (+/-)
 * @param value - The number to convert to a string
 * @param emptyStringZero - If the value is zero, return an empty string
 * @param zeroIsNegative - Treat zero as a negative value
 */
function signedInteger(
  value: number,
  { emptyStringZero = false, zeroIsNegative = false } = {},
): string {
  if (value === 0 && emptyStringZero) return "";
  const maybeNegativeZero = zeroIsNegative && value === 0 ? -0 : value;
  return MHLCore.instance.signedIntFormatter.format(maybeNegativeZero);
}

const wordCharacter = String.raw`[\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Join_Control}]`;
const nonWordCharacter = String.raw`[^\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Join_Control}]`;
const nonWordBoundary = String.raw`(?=^|$|${wordCharacter})`;
const lowerCaseLetter = String.raw`\p{Lowercase_Letter}`;
const upperCaseLetter = String.raw`\p{Uppercase_Letter}`;

const nonWordCharacterRE = new RegExp(nonWordCharacter, "gu");
const lowerCaseThenUpperCaseRE = new RegExp(
  `(${lowerCaseLetter})(${upperCaseLetter}${nonWordBoundary})`,
  "gu",
);
const nonWordCharacterHyphenOrSpaceRE =
  /[^-\p{White_Space}\p{Alphabetic}\p{Mark}\p{Decimal_Number}\p{Join_Control}]/gu;
const upperOrWordBoundariedLowerRE = new RegExp(
  `${upperCaseLetter}|${nonWordCharacter}${lowerCaseLetter}`,
  "gu",
);

/**
 * The system's sluggification algorithm for labels and other terms.
 * @param text    - The text to sluggify
 * @param options - Sluggification options
 */
function sluggify(
  text: string,
  { camel = null }: SluggifyOptions = {},
): string {
  // Sanity check
  if (typeof text !== "string") {
    console.warn("Non-string argument passed to `sluggify`");
    return "";
  }

  // A hyphen by its lonesome would be wiped: return it as-is
  if (text === "-") return text;

  switch (camel) {
    case null:
      return text
        .replace(lowerCaseThenUpperCaseRE, "$1-$2")
        .toLowerCase()
        .replace(/['’]/g, "")
        .replace(nonWordCharacterRE, " ")
        .trim()
        .replace(/[-\s]+/g, "-");
    case "bactrian": {
      const dromedary = sluggify(text, { camel: "dromedary" });
      return dromedary.charAt(0).toUpperCase() + dromedary.slice(1);
    }
    case "dromedary":
      return text
        .replace(nonWordCharacterHyphenOrSpaceRE, "")
        .replace(/[-_]+/g, " ")
        .replace(upperOrWordBoundariedLowerRE, (part, index) =>
          index === 0 ? part.toLowerCase() : part.toUpperCase(),
        )
        .replace(/\s+/g, "");
    default:
      throw Error("I don't think that's a real camel.");
  }
}

type SluggifyOptions = {
  /** The sluggification method */
  camel?: SlugCamel;
};

type SlugCamel = "dromedary" | "bactrian" | null;

export { sluggify, signedInteger };
