import { config as base } from "@multifeed/eslint-config/base";
import convexPlugin from "@convex-dev/eslint-plugin";

export default [
  ...base,
  ...convexPlugin.configs.recommended,
  {
    ignores: ["convex/_generated/**"],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
