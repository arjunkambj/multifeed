"use client";

import { useEffect } from "react";
import { TIMEZONE_COOKIE } from "@/lib/timezone";

export function TimezoneCookie() {
  useEffect(() => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const encoded = encodeURIComponent(timeZone);
    const existing = document.cookie
      .split("; ")
      .find((part) => part.startsWith(`${TIMEZONE_COOKIE}=`))
      ?.slice(TIMEZONE_COOKIE.length + 1);

    if (existing === encoded) return;

    // Readable by Server Components on the next request; Cookie Store is not universal.
    // biome-ignore lint/suspicious/noDocumentCookie: persist timezone for RSC preloads
    document.cookie = `${TIMEZONE_COOKIE}=${encoded}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  return null;
}
