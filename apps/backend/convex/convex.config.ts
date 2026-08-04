import hexclaveAuthComponent from "@hexclave/next/convex.config";
import r2 from "@convex-dev/r2/convex.config.js";
import { ComponentDefinition } from "convex/server";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(hexclaveAuthComponent as unknown as ComponentDefinition);
app.use(r2);

export default app;
