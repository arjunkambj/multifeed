import { config as base } from "@unifeed/eslint-config/base";

export default [
  ...base,
  {
    ignores: ["convex/_generated/**"],
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];
