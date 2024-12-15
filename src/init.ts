import { MODULE_ID } from "./constants.ts";
import { MHLCore } from "./MHLCore.ts";

Hooks.on("init", () => {
  const MODULE = game.modules.get(MODULE_ID);
  const mhlCore = new MHLCore();
  MODULE.api = mhlCore;
  globalThis.mhl = mhlCore;
});
