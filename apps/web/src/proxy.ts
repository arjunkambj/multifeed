import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { hexclaveServerApp } from "@/hexclave/server";

export const config = {
  matcher: ["/sign-in"],
};

export async function proxy(request: NextRequest) {
  // A malformed/expired session must not 500 the sign-in pages.
  const user = await hexclaveServerApp
    .getUser({ tokenStore: request })
    .catch(() => null);

  if (user) {
    return NextResponse.redirect(new URL("/overview", request.url));
  }

  return NextResponse.next();
}
