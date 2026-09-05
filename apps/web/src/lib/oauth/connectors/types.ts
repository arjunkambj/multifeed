export const OAUTH_PLATFORMS = [
  "facebook",
  "instagram",
  "threads",
  "linkedin",
  "youtube",
  "x",
  "tiktok",
] as const;

export type OAuthPlatform = (typeof OAUTH_PLATFORMS)[number];

type Capability =
  | "text"
  | "image"
  | "video"
  | "carousel"
  | "analytics"
  | "inbox";

type TokenType = "user" | "page" | "organization";

export type TokenBundle = {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  refreshTokenExpiresAt?: number;
  scopes: string[];
  tokenType?: TokenType;
};

export type AccountProfile = {
  providerAccountId: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  tokenType?: TokenType;
  metadata?: Record<string, unknown>;
};

export type AccountOption = {
  id: string;
  label: string;
  username?: string;
  avatarUrl?: string;
  metadata?: Record<string, unknown>;
};

type AuthorizeInput = {
  state: string;
  redirectUri: string;
  codeChallenge?: string;
};

type ExchangeInput = {
  code: string;
  redirectUri: string;
  codeVerifier?: string;
};

export type SocialConnector = {
  platform: OAuthPlatform;
  capabilities: Capability[];
  requiresPkce: boolean;
  buildAuthorizeUrl: (input: AuthorizeInput) => string;
  exchangeCode: (input: ExchangeInput) => Promise<TokenBundle>;
} & (
  | {
      fetchProfile: (accessToken: string) => Promise<AccountProfile>;
      listAccounts?: never;
      resolveAccount?: never;
    }
  | {
      fetchProfile?: never;
      listAccounts: (accessToken: string) => Promise<AccountOption[]>;
      resolveAccount: (
        tokens: TokenBundle,
        option: AccountOption,
      ) => Promise<{ tokens: TokenBundle; profile: AccountProfile }>;
    }
);

export function isOAuthPlatform(value: string): value is OAuthPlatform {
  return OAUTH_PLATFORMS.some((platform) => platform === value);
}
