import hexclaveAuthComponent from "@hexclave/next/convex.config";
import r2 from "@convex-dev/r2/convex.config.js";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(hexclaveAuthComponent as any);
app.use(r2);

export default app;
