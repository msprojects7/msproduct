import { createAuthClient } from '@neondatabase/auth/next';

export const authClient = createAuthClient();

export type AuthClient = typeof authClient;
