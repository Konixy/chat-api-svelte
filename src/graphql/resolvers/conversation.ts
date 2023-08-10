import { GraphQLError } from 'graphql';
import { ConversationPopulated, GraphQLContext } from '../../lib/types';
import { Prisma } from '@prisma/client';
import { withFilter } from 'graphql-subscriptions';
import { userIsConversationParticipant } from '../../lib/util';

const resolvers = {
  Query: {
    conversations: async (_: any, __: any, { session, prisma }: GraphQLContext): Promise<ConversationPopulated[]> => {
      if (!session?.user) {
        throw new GraphQLError('Not authorized.');
      }

      const {
        user: { id: userId },
      } = session;

      try {
        const conversations = await prisma.conversation.findMany({
          where: {
            participants: {
              some: {
                userId: {
                  equals: userId,
                },
              },
            },
          },
          include: conversationPopulated,
        });

        return conversations;
      } catch (err) {
        console.log('conversations ERROR', err);
        throw new GraphQLError(err.message);
      }
    },
  },
  Mutation: {
    createConversation: async (
      _: any,
      { participantsIds }: { participantsIds: string[] },
      { session, prisma, pubsub }: GraphQLContext,
    ): Promise<{ conversationId: string }> => {
      if (!session.user) throw new GraphQLError('Not authorized.');

      const {
        user: { id: userId },
      } = session;

      try {
        // if a conversation exists with the following participants, just return the conversation id of the existing conversation

        const conversation = await prisma.conversation.create({
          data: {
            id: String(Date.now()),
            participants: {
              createMany: {
                data: participantsIds.map((id) => ({
                  userId: id,
                  hasSeenAllMessages: id === userId,
                })),
              },
            },
          },
          include: conversationPopulated,
        });

        pubsub.publish('CONVERSATION_UPDATED', {
          conversationUpdated: conversation,
        });

        return {
          conversationId: conversation.id,
        };
      } catch (err) {
        console.log('createConversation ERROR', err);
        throw new GraphQLError('Error creating conversation');
      }
    },
    markConversationAsRead: async (_: any, { conversationId }: { conversationId: string }, { session, prisma, pubsub }: GraphQLContext): Promise<boolean> => {
      if (!session.user) throw new GraphQLError('Not authorized.');

      const {
        user: { id: userId },
      } = session;

      try {
        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            userId,
            conversationId,
          },
        });

        if (!participant) throw new GraphQLError('Participant entity not found.');

        await prisma.conversationParticipant.update({
          where: {
            id: participant.id,
          },
          data: {
            hasSeenAllMessages: true,
          },
        });

        return true;
      } catch (err) {
        console.log('markConversationAsRead ERROR', err);
        throw new GraphQLError('Error marking conversation as read');
      }
    },
  },
  Subscription: {
    conversationUpdated: {
      subscribe: withFilter(
        (_, __, { pubsub }: GraphQLContext) => pubsub.asyncIterator('CONVERSATION_UPDATED'),
        ({ conversationUpdated: { participants } }: { conversationUpdated: ConversationPopulated }, _, { session }: GraphQLContext) => {
          if (!session.user) throw new GraphQLError('Not Authorized.');

          return userIsConversationParticipant(participants, session.user.id);
        },
      ),
    },
  },
};

export type ConversationSubscriptionPayload<SubscriptionName extends string> = {
  [Property in SubscriptionName]: ConversationPopulated;
};

export const userPopulated = {
  id: true,
  username: true,
  name: true,
  image: true,
};

export const participantPopulated = Prisma.validator<Prisma.ConversationParticipantInclude>()({
  user: {
    select: userPopulated,
  },
});

export const conversationPopulated = Prisma.validator<Prisma.ConversationInclude>()({
  participants: {
    include: participantPopulated,
  },
  latestMessage: {
    include: {
      sender: {
        select: userPopulated,
      },
    },
  },
});

export default resolvers;
