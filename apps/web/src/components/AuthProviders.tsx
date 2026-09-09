"use client";

import { HexclaveProvider, HexclaveTheme } from "@hexclave/next";
import { hexclaveClientApp } from "@/hexclave/client";

export function AuthProviders({ children }: { children: React.ReactNode }) {
  return (
    <HexclaveProvider app={hexclaveClientApp}>
      <HexclaveTheme>{children}</HexclaveTheme>
    </HexclaveProvider>
  );
}
