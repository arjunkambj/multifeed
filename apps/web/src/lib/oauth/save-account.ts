import { fetchMutation } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import type {
  AccountProfile,
  OAuthPlatform,
  SocialConnector,
  TokenBundle,
} from "./connectors/types";
import { oauthServerSecret } from "./env";

export async function saveConnectedAccount(input: {
  token: string;
  platform: OAuthPlatform;
  connector: SocialConnector;
  tokens: TokenBundle;
  profile: AccountProfile;
}) {
  return await fetchMutation(
    api.oauth.accounts.save,
    {
      serverSecret: oauthServerSecret(),
      platform: input.platform,
      providerAccountId: input.profile.providerAccountId,
      username: input.profile.username,
      displayName: input.profile.displayName,
      avatarUrl: input.profile.avatarUrl,
      tokenType: input.profile.tokenType ?? input.tokens.tokenType,
      capabilities: input.connector.capabilities,
      scopes: input.tokens.scopes,
      accessToken: input.tokens.accessToken,
      refreshToken: input.tokens.refreshToken,
      tokenExpiresAt: input.tokens.expiresAt,
      refreshTokenExpiresAt: input.tokens.refreshTokenExpiresAt,
      metadata: input.profile.metadata,
    },
    { token: input.token },
  );
}
