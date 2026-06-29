# Unifeed

Unifeed is a trimmed auth-first prop-firm landing app built with Next.js, Convex, Hexclave, and Turborepo.

## What stays

- `apps/web`: landing page plus Hexclave routes.
- `apps/backend`: only Convex auth config, `users` schema, Hexclave webhook sync, and auth/user helpers.
- `packages/eslint-config` and `packages/typescript-config`: shared workspace config.

## Routes

- `/`: public landing page.
- `/sign-in`: authentication entry.
- `/handler/[...hexclave]`: Hexclave handler route.

## Convex scope

- `auth.config.ts`: Hexclave provider config for Convex auth.
- `schema.ts`: `users` table only.
- `http.ts`: Hexclave webhook route.
- `webhooks/hexclave.ts`: syncs `user.created`, `user.updated`, and `user.deleted`.
- `core/users.ts`: internal webhook upsert/delete mutations.
- `users.ts`: current-user query.
- `lib/auth.ts`: auth helpers.

## Local development

```bash
pnpm install
pnpm lint
pnpm check-types
```

Useful scoped commands:

```bash
pnpm --filter @unifeed/web dev
pnpm --filter @unifeed/backend dev
```

## Required env

- `NEXT_PUBLIC_HEXCLAVE_PROJECT_ID`
- `NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY`
- `HEXCLAVE_SECRET_SERVER_KEY`
- `HEXCLAVE_WEBHOOK_SECRET`

## Notes

- The admin app and product flows beyond landing/auth were removed from the active workspace.
- Do not edit Convex generated files under `apps/backend/convex/_generated`.
