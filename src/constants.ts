export const MODULE_ID = "mhl3";
export type MODULE_ID = "mhl3";
export const fu = foundry.utils;

export const CONSOLE_TYPES = [
  "trace",
  "debug",
  "log",
  "info",
  "warn",
  "error",
] as const;
export const BANNER_TYPES = ["info", "warning", "error"] as const;
export const LABELABLE_TAGS = [
  "button",
  "input",
  "meter",
  "output",
  "progress",
  "select",
  "textarea",
] as const;
