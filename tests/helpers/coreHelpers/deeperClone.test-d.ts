import { expectTypeOf } from "vitest";
import type { DeeperClone } from "../../../src/helpers/coreHelpers.ts";

expectTypeOf<DeeperClone<[1, 2, 3]>>().toEqualTypeOf<[1, 2, 3]>();
