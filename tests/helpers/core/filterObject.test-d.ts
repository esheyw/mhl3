import { test, expectTypeOf } from "vitest";
import type { FilterObject } from "../../../src/helpers/coreHelpers.ts";

type oneLayerTarget = {
  foo: number;
  bar: string;
  baz: boolean;
};
type oneLayerTemplateSameTypes = {
  foo: number;
  baz: boolean;
};
type oneLayerTemplateDifferentTypes = {
  foo: boolean;
  baz: string;
};
type oneLayerExpected1 = {
  foo: number;
  baz: boolean;
};
test(`filtering an object 
      - one level deep
      - template has fewer keys
      - same types per key
      - different values per key
      - default options`, () => {
  expectTypeOf<
    FilterObject<oneLayerTarget, oneLayerTemplateSameTypes>
  >().toMatchTypeOf<>();
});
