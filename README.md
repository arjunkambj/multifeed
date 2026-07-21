# Multi Feed

Social scheduling app built with Next.js, Convex, Hexclave, and Turborepo.

## Apps

- `apps/web`: Next.js app (marketing, dashboard, OAuth API routes)
- `apps/backend`: Convex schema, mutations/queries, billing webhooks
- `apps/oauth-relay`: optional Cloudflare Worker for HTTPS-to-localhost OAuth callbacks

## Local development

```bash
pnpm install

# Env samples (separate for web vs backend)
cp apps/web/.env.sample apps/web/.env.local
cp apps/backend/.env.sample apps/backend/.env.local
# Fill values, then set Convex deployment secrets (see below)

pnpm --filter @multifeed/backend dev
pnpm --filter @multifeed/web dev
```

## Environment variables

Samples live next to each app (do **not** put provider secrets in Convex, or Convex secrets in Next):

| File                                                   | App     | Loaded by                               |
| ------------------------------------------------------ | ------- | --------------------------------------- |
| [`apps/web/.env.sample`](apps/web/.env.sample)         | Next.js | `.env.local` for `next dev` / deploy    |
| [`apps/backend/.env.sample`](apps/backend/.env.sample) | Convex  | CLI `.env.local` + `npx convex env set` |

### Web (`apps/web/.env.local`) — summary

| Group             | Variables                                                                                                      |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| **Core**          | `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_APP_URL`                                                                |
| **Hexclave**      | `NEXT_PUBLIC_HEXCLAVE_PROJECT_ID`, `NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY`, `HEXCLAVE_SECRET_SERVER_KEY` |
| **Dodo checkout** | `DODO_PAYMENTS_API_KEY`, `DODO_PAYMENTS_ENVIRONMENT`, `DODO_*_PRODUCT_ID` (6 product IDs)                      |
| **OAuth**         | `OAUTH_SERVER_SECRET`, `META_*`, `THREADS_*`, `LINKEDIN_*`, `GOOGLE_*`, `TIKTOK_*`, `X_*`                      |
| **Optional**      | `APP_ORIGIN`, `OAUTH_REDIRECT_URI`                                                                             |

OAuth redirect on every provider console:

```
http://localhost:3000/api/oauth/callback
https://themultifeed.com/api/oauth/callback
```

For local provider setups that require HTTPS, deploy `apps/oauth-relay` and set
`OAUTH_REDIRECT_URI` to its configured HTTPS route. The Worker forwards the
callback query to `http://localhost:3000/api/oauth/callback`. Its custom route is
development-only: remove or disable it before serving the production callback
from the same domain and path.

Provider-console requirements:

| Provider  | Required setup                                                                                                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Facebook  | Business-type app with Facebook Login for Business; create a User access token configuration containing the requested Page permissions and set its ID as `META_FACEBOOK_CONFIG_ID`            |
| Instagram | Instagram API with Facebook Login for Business; create a User access token configuration containing the requested `instagram_*`/Page permissions and set its ID as `META_INSTAGRAM_CONFIG_ID` |
| Threads   | Threads use case with its own Threads App ID/secret; permissions `threads_basic`, `threads_content_publish`, `threads_manage_insights`                                                        |
| LinkedIn  | Sign In with LinkedIn using OpenID Connect plus Share on LinkedIn; programmatic refresh tokens require Marketing Developer Platform approval                                                  |
| YouTube   | Enable YouTube Data API v3 and YouTube Analytics API; configure the OAuth consent screen for the requested scopes                                                                             |
| TikTok    | Login Kit and Content Posting API with approved `user.info.basic`, `user.info.profile`, and `video.publish` scopes                                                                            |
| X         | OAuth 2.0 enabled with exact callback URL; use a confidential client secret when available                                                                                                    |

### Backend / Convex — summary

Set on the **deployment** (Dashboard or `npx convex env set` from `apps/backend`):

| Group                 | Variables                                                                          |
| --------------------- | ---------------------------------------------------------------------------------- |
| **Auth**              | `NEXT_PUBLIC_HEXCLAVE_PROJECT_ID` (same as web)                                    |
| **Token crypto**      | `TOKEN_ENCRYPTION_KEY` (`openssl rand -hex 32`)                                    |
| **OAuth server auth** | `OAUTH_SERVER_SECRET` (same 64-char hex value as `apps/web`)                       |
| **Dodo webhook**      | `DODO_PAYMENTS_WEBHOOK_KEY` → `https://<CONVEX_SITE_URL>/webhook/dodopayment`      |
| **Limits (prod)**     | `BILLING_SOFT_LIMITS=false`                                                        |
| **R2 media**          | `R2_BUCKET`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_TOKEN` |

```bash
cd apps/backend
npx convex env set NEXT_PUBLIC_HEXCLAVE_PROJECT_ID "..."
npx convex env set TOKEN_ENCRYPTION_KEY "$(openssl rand -hex 32)"
npx convex env set OAUTH_SERVER_SECRET "<same value as apps/web>"
npx convex env set DODO_PAYMENTS_WEBHOOK_KEY "whsec_..."
# npx convex env set BILLING_SOFT_LIMITS false
# npx convex env set R2_BUCKET ...
```

### OAuth flow (reference)

1. `POST /api/oauth/start` → `sessions.create` → provider URL
2. Provider → `GET /api/oauth/callback` → `beginExchange` → token exchange and account discovery
3. All discovered accounts are resolved first, then committed atomically by `accounts.saveMany`

UI: `/connections`

## Notes

- Do not edit `apps/backend/convex/_generated`.
- Do not use Convex HTTP for OAuth (Dodo webhook only).
- Media: R2 backend ready; composer media picker still stubbed.
- “Post now” queues as `scheduled` with `scheduledFor: now` until a publisher exists.
