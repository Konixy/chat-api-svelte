import { User } from '@prisma/client';
import type { GraphQLContext, CreateUsernameResponse } from '../../lib/types';
import { GraphQLError } from 'graphql';

const resolvers = {
  Query: {
    searchUsers: async (_: any, { query }: { query: string }, { session, prisma }: GraphQLContext): Promise<User[]> => {
      if (!session.user) {
        throw new GraphQLError('Not authorized.');
      }

      const { username: myUsername } = session.user;

      try {
        const users = await prisma.user.findMany({
          where: {
            username: {
              contains: query,
              not: myUsername,
              mode: 'insensitive',
            },
          },
        });

        return users;
      } catch (err: any) {
        console.log('searchUsers ERROR', err);
        throw new GraphQLError(err.message);
      }
    },
    getUsers: async (_: any, __: any, { session, prisma }: GraphQLContext): Promise<User[]> => {
      if (!session.user) {
        throw new GraphQLError('Not authorized.');
      }

      const { username: myUsername } = session.user;

      try {
        const users = await prisma.user.findMany({
          where: {
            username: {
              not: myUsername,
              mode: 'insensitive',
            },
          },
        });

        return users;
      } catch (err: any) {
        console.log('getUsers ERROR', err);
        throw new GraphQLError(err.message);
      }
    },
  },
  Mutation: {
    createUsername: async (_: any, { username }: { username: string }, { session, prisma }: GraphQLContext): Promise<CreateUsernameResponse> => {
      if (!session.user) {
        return {
          error: 'User must be logged in',
        };
      } else if (!username.match(/^(?=.{4,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/)) {
        return {
          error: "Username don't match the regex.",
        };
      }

      const { id: userId } = session.user;

      try {
        const existingUser = await prisma.user.findUnique({
          where: {
            username,
          },
        });

        if (existingUser)
          return {
            error: 'Username is taken. Try another ',
          };

        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            username,
          },
        });

        return { success: true };
      } catch (err) {
        console.log('CreateUsername ERROR:', err);
        return { error: err.message };
      }
    },
  },
  // Subscription: {},
};

export default resolvers;
