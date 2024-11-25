import type {
  IntentionalPartial,
  LoggingLevels,
} from "fvtt-types/src/types/helperTypes.d.mts";
import type { LocalizationContext, LocalizeOptions } from "../foundry/i18n.ts";

export type LogOptions = {
  type: LoggingLevels;
  softType: LoggingLevels;
  text: string;
  prefix: string;
  localize: boolean;
  localizeOptions: LocalizeOptions;
  context: LocalizationContext;
  banner: boolean | Notifications.Notification["type"];
  permanent: boolean;
  console: boolean;
  clone: boolean;
  error: boolean;
};

export function log(
  loggable: unknown,
  {
    type,
    softType,
    text,
    prefix,
    localize: doLocalize = true,
    localizeOptions,
    context,
    banner = false,
    permanent = false,
    console: doConsole = true,
    clone = true,
    error = false,
  }: IntentionalPartial<LogOptions> = {},
): Error | undefined {}
