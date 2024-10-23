import type { InexactPartial } from "fvtt-types/src/types/utils.d.mts";
import { MODULE_ID } from "./constants.ts";
import { MHLCore } from "./MHLCore.ts";

type TestThingOptions = {
  bob: number;
  jim: string;
  alice: boolean;
};
function testThing(
  options: InexactPartial<TestThingOptions> = { bob: 5, jim: "hi", alice: true },
): void {
  console.warn(options);
}
Hooks.on("init", () => {
  const MODULE = game.modules.get(MODULE_ID);
  const mhlCore = new MHLCore();
  MODULE.api = mhlCore;
  globalThis.mhl = mhlCore;
  testThing({jim: "bye"});
});
