type RequiredEnvName =
  | "NEXT_PUBLIC_CONVEX_URL"
  | "NEXT_PUBLIC_HEXCLAVE_PROJECT_ID"
  | "NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY";

const missingEnv = (name: RequiredEnvName): never => {
  throw new Error(`Missing ${name}`);
};

const requiredEnv = (value: string | undefined, name: RequiredEnvName) =>
  value || missingEnv(name);

export const clientEnv = {
  NEXT_PUBLIC_CONVEX_URL: requiredEnv(
    process.env.NEXT_PUBLIC_CONVEX_URL,
    "NEXT_PUBLIC_CONVEX_URL",
  ),
  NEXT_PUBLIC_HEXCLAVE_PROJECT_ID: requiredEnv(
    process.env.NEXT_PUBLIC_HEXCLAVE_PROJECT_ID,
    "NEXT_PUBLIC_HEXCLAVE_PROJECT_ID",
  ),
  NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY: requiredEnv(
    process.env.NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY,
    "NEXT_PUBLIC_HEXCLAVE_PUBLISHABLE_CLIENT_KEY",
  ),
};

export const serverEnv = {
  ...clientEnv,
};
