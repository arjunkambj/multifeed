# MultiFeed Web

`apps/web` is the public MultiFeed site.

## Scope

- `/`: landing page
- `/sign-in`: Hexclave entry
- `/handler/[...hexclave]`: Hexclave handler

## Commands

```bash
pnpm --filter @multifeed/web dev
pnpm --filter @multifeed/web lint
pnpm --filter @multifeed/web check-types
```
