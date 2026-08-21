import { today } from "@internationalized/date";

export const TIMEZONE_COOKIE = "multifeed-timezone";

export function parseTimeZone(value: string | undefined) {
  if (!value) return "UTC";
  try {
    const timeZone = decodeURIComponent(value);
    today(timeZone);
    return timeZone;
  } catch {
    return "UTC";
  }
}
