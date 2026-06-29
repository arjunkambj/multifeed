# unifeed Web

`apps/web` is the public unifeed site.

## Scope

- `/`: landing page
- `/sign-in`: Hexclave entry
- `/handler/[...hexclave]`: Hexclave handler

## Commands

```bash
pnpm --filter @unifeed/web dev
pnpm --filter @unifeed/web lint
pnpm --filter @unifeed/web check-types
```
