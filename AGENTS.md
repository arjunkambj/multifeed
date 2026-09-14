# Repository Guidelines

## Project Structure & Module Organization

MultiFeed is a pnpm/Turborepo workspace for a social scheduling product.

- `apps/web`: Next.js 16 frontend. Routes live in `src/app`, shared UI in `src/components`, browser/server helpers in `src/lib`, and static assets in `public`.
- `apps/backend`: Convex backend. Schema, queries, mutations, actions, crons, webhooks, and publishing integrations live in `convex/`.
- `packages/plans`: shared subscription-plan definitions.
- `packages/ui`: shared shadcn/ui components, hooks, `cn()` util, and theme globals. Apps import via `@multifeed/ui/components/*`, `@multifeed/ui/lib/*`, `@multifeed/ui/hooks/*`, and `@multifeed/ui/globals.css`. Run `shadcn add` from `apps/web` or `packages/ui` — both have `components.json`.
- `packages/typescript-config`: shared TypeScript configurations.

Never edit `apps/backend/convex/_generated/`; Convex produces those files.

## Build, Test, and Development Commands

```bash
pnpm install                         # install workspace dependencies
pnpm lint                            # run Oxlint
pnpm format:check                    # verify formatting with Oxfmt
pnpm check-types                     # type-check all packages
pnpm test                            # run backend Node tests
```

## Testing Guidelines

Dont Write Test if not asked by user

## Commit & Pull Request Guidelines

Always do Features wise Commits
