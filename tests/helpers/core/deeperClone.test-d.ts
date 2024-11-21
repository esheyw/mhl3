import { expectTypeOf } from "vitest";
import type { DeeperClone } from "../../../src/helpers/core/deeperClone.ts";

expectTypeOf<DeeperClone<[1, 2, 3]>>().toEqualTypeOf<[1, 2, 3]>();
