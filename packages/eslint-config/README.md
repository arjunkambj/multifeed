# `@multifeed/eslint-config`

Shared ESLint config for the Convex backend. The Next.js app uses Biome.

`typescript-eslint` does not support TypeScript 7 yet, so this package depends on
TypeScript 6 only to parse Convex files. Apps still typecheck with TypeScript 7.
