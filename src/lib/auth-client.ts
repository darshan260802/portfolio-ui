import { createAuthClient } from "better-auth/react";
import { API_URL } from "./env";

export const authClient = createAuthClient({
	baseURL: API_URL,
	fetchOptions: { credentials: "include" },
});

export const { useSession, signIn, signUp, signOut, requestPasswordReset, resetPassword } = authClient;
