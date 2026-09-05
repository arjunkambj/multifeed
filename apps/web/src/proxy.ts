import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { hexclaveServerApp } from "@/hexclave/server";

export const config = {
  matcher: ["/sign-in", "/sign-up"],
};

export async function proxy(request: NextRequest) {
  const user = await hexclaveServerApp.getUser({ tokenStore: request });

  if (user) {
    return NextResponse.redirect(new URL("/overview", request.url));
  }

  return NextResponse.next();
}
