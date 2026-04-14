import { createAuthClient } from "better-auth/react";

const runtimeOrigin = typeof window !== "undefined" ? window.location.origin : undefined;
const authClientBaseURL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.BETTER_AUTH_URL ||
  runtimeOrigin ||
  "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: authClientBaseURL,
});

export const { signIn, signUp, signOut, useSession } = authClient;
