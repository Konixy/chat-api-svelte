import type { PrismaClient } from "@prisma/client";

export type Session = {
  user?: {
    name?: string | null;
    email?: string | null;
    emailVerified: boolean | null;
    image?: string | null;
    id?: string | null;
    username?: string | null;
  };
  expires: string;
};

export type GraphQLContext = {
  session?: Session | null;
  prisma: PrismaClient;
};

/**
 * Users
 */

export type CreateUsernameResponse = {
  success?: boolean;
  error?: string;
};
