import { ConversationPopulated, GraphQLContext, Message, SendMessageArguments } from '../../lib/types';
import { userIsConversationParticipant } from '../../lib/util';
import { Prisma } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { withFilter } from 'graphql-subscriptions';
import { conversationPopulated, userPopulated } from './conversation';

const resolvers = {
  Query: {
    messages: async function (_: any, { conversationId }: { conversationId: string }, { session, prisma }: GraphQLContext): Promise<Message[]> {
      if (!session?.user) {
        throw new GraphQLError('Not authorized.');
      }

      const {
        user: { id: userId },
      } = session;

      const conversation = await prisma.conversation.findUnique({
        where: {
          id: conversationId,
        },
        include: conversationPopulated,
      });

      if (!conversation) {
        throw new GraphQLError('Conversation Not Found');
      }

      if (!userIsConversationParticipant(conversation.participants, userId)) {
        throw new GraphQLError('Not authorized.');
      }

      try {
        const messages = await prisma.message.findMany({
          where: {
            conversationId,
          },
          include: messagePopulated,
          orderBy: {
            createdAt: 'desc',
          },
        });

        return messages;
      } catch (err) {
        console.log('messages ERROR', err);
        throw new GraphQLError('There was an error while trying to fetch messages');
      }
    },
  },
  Mutation: {
    sendMessage: async function (
      _: any,
      { id: messageId, senderId, conversationId, body }: SendMessageArguments,
      { session, prisma, pubsub }: GraphQLContext,
    ): Promise<boolean> {
      if (!session?.user) {
        throw new GraphQLError('Not authorized.');
      }

      const {
        user: { id: userId },
      } = session;

      if (userId !== senderId) {
        throw new GraphQLError('Not authorized.');
      }

      try {
        const conversation = await prisma.conversation.findUnique({
          where: {
            id: conversationId,
          },
          include: {
            participants: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                  },
                },
              },
            },
          },
        });

        if (!conversation) throw new GraphQLError('Invalid conversation id.');

        // const participant = await prisma.conversationParticipant.findFirst({
        //   where: {
        //     userId: senderId,
        //     conversationId,
        //   },
        // });

        const participant = conversation.participants.find((p) => p.user.id === userId);

        if (!participant) throw new GraphQLError('Participant does not exist.');

        const newMessage = await prisma.message.create({
          data: {
            id: messageId,
            senderId,
            conversationId,
            body,
          },
          include: messagePopulated,
        });

        const newConversation = await prisma.conversation.update({
          where: {
            id: conversationId,
          },
          data: {
            latestMessageId: newMessage.id,
            participants: {
              update: {
                where: {
                  id: participant.id,
                  conversationId,
                },
                data: {
                  hasSeenAllMessages: true,
                },
              },
              updateMany: {
                where: {
                  conversationId,
                  NOT: {
                    userId,
                  },
                },
                data: {
                  hasSeenAllMessages: false,
                },
              },
            },
          },
          include: conversationPopulated,
        });

        pubsub.publish('NEW_MESSAGE', { newMessage, conversation: newConversation });

        pubsub.publish('CONVERSATION_UPDATED', {
          conversationUpdated: newConversation,
        });
      } catch (err) {
        console.log('sendMessage ERROR', err);
        throw new GraphQLError('Error sending message');
      }

      return true;
    },
  },
  Subscription: {
    newMessage: {
      subscribe: withFilter(
        (_: any, __: any, { pubsub }: GraphQLContext) => pubsub.asyncIterator('NEW_MESSAGE'),
        (payload: MessageSentSubscriptionPayload, _: any, { session }: GraphQLContext) =>
          !!payload.conversation.participants.find((e) => e.user.id === session.user.id),
      ),
    },
  },
};

type MessageSentSubscriptionPayload = {
  newMessage: Message;
  conversation: ConversationPopulated;
};

export const messagePopulated = Prisma.validator<Prisma.MessageInclude>()({
  sender: {
    select: userPopulated,
  },
});

export default resolvers;
