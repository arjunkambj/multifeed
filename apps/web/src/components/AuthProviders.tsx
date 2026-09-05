import { HexclaveProvider, HexclaveTheme } from "@hexclave/next";
import { hexclaveServerApp } from "@/hexclave/server";

export function AuthProviders({ children }: { children: React.ReactNode }) {
  return (
    <HexclaveProvider app={hexclaveServerApp}>
      <HexclaveTheme>{children}</HexclaveTheme>
    </HexclaveProvider>
  );
}
