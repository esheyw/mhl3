import { test, expect } from "vitest";
import { filterObject } from "../../../src/helpers/coreHelpers.ts";

const oneLayerTarget = {
  foo: 1,
  bar: "hi",
  baz: true,
};
const oneLayerTemplate = {
  foo: 2,
  baz: false,
};
test.skip(`filtering an object 
      - one level deep
      - template has fewer keys
      - same types per key
      - different values per key
      - default options`, () => {
  expect(filterObject(oneLayerTarget, oneLayerTemplate)).toEqual({
    foo: 1,
    baz: true,
  });
});
