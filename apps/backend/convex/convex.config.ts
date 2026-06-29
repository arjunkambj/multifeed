import hexclaveAuthComponent from "@hexclave/next/convex.config";
import type { ComponentDefinition } from "convex/server";
import { defineApp } from "convex/server";

const app = defineApp();
app.use(hexclaveAuthComponent as ComponentDefinition);

export default app;
