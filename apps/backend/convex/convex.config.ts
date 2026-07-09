import hexclaveAuthComponent from "@hexclave/next/convex.config";
import { defineApp } from "convex/server";

const app = defineApp();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use(hexclaveAuthComponent as any);

export default app;
