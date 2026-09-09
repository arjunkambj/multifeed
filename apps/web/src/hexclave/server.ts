import "server-only";

import { HexclaveServerApp } from "@hexclave/next";
import type { NextRequest } from "next/server";
import { hexclaveClientApp } from "./client";

export const hexclaveServerApp = new HexclaveServerApp({
  inheritsFrom: hexclaveClientApp,
  secretServerKey: process.env.HEXCLAVE_SECRET_SERVER_KEY!,
});

export const getHexclaveConvexServerToken = async (request?: NextRequest) => {
  const token = await hexclaveServerApp.getConvexHttpClientAuth({
    tokenStore: request ?? "nextjs-cookie",
  });

  return token.length ? token : null;
};
