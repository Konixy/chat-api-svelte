import { User } from '@prisma/client';
import type { GraphQLContext } from '../../lib/types';
import { GraphQLError } from 'graphql';

const resolvers = {
  Query: {
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

        return users.filter((u) => u.username);
      } catch (err: any) {
        console.log('getUsers ERROR', err);
        throw new GraphQLError(err.message);
      }
    },
    getUser: async (_: any, { id }: { id: string }, { session, prisma }: GraphQLContext): Promise<User> => {
      if (!session.user) {
        throw new GraphQLError('Not authorized.');
      }

      try {
        const user = prisma.user.findUnique({ where: { id } });

        if (!user) throw new GraphQLError('This user does not exist.');

        return user;
      } catch (err: any) {
        console.log('getUser ERROR', err);
        throw new GraphQLError(err.message);
      }
    },
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
  },
  Mutation: {
    createUsername: async (_: any, { username }: { username: string }, { session, prisma }: GraphQLContext): Promise<boolean> => {
      if (!session.user) {
        throw new GraphQLError('Not authorized');
      } else if (!username.match(/^(?=.{4,20}$)(?![_.])(?!.*[_.]{2})[a-zA-Z0-9._]+(?<![_.])$/)) {
        throw new GraphQLError("Username donesn't match the regex");
      }

      const { id: userId } = session.user;

      try {
        const existingUser = await prisma.user.findUnique({
          where: {
            username,
          },
        });

        if (existingUser) throw new GraphQLError('Username is allready taken');

        await prisma.user.update({
          where: {
            id: userId,
          },
          data: {
            username,
          },
        });

        return true;
      } catch (err) {
        // console.log('createUsername ERROR:', err);
        throw new GraphQLError(err);
      }
    },
  },
  // Subscription: {},
};

export default resolvers;
