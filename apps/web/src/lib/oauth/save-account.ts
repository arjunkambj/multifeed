import { fetchMutation } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import type {
  AccountProfile,
  OAuthPlatform,
  SocialConnector,
  TokenBundle,
} from "./connectors/types";
import { oauthServerSecret } from "./env";

export async function saveConnectedAccounts(input: {
  token: string;
  platform: OAuthPlatform;
  connector: SocialConnector;
  accounts: Array<{
    tokens: TokenBundle;
    profile: AccountProfile;
  }>;
}) {
  return fetchMutation(
    api.oauth.accounts.saveMany,
    {
      serverSecret: oauthServerSecret(),
      accounts: input.accounts.map(({ profile, tokens }) => ({
        platform: input.platform,
        providerAccountId: profile.providerAccountId,
        username: profile.username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        tokenType: profile.tokenType ?? tokens.tokenType,
        capabilities: input.connector.capabilities,
        scopes: tokens.scopes,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
        refreshTokenExpiresAt: tokens.refreshTokenExpiresAt,
        metadata: profile.metadata,
      })),
    },
    { token: input.token },
  );
}
