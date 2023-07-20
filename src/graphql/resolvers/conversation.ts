import { ApolloError } from "apollo-server-core";
import { ConversationPopulated, GraphQLContext } from "../../lib/types";
import { Prisma } from "@prisma/client";

const resolvers = {
  Query: {
    conversations: async (
      _: any,
      __: any,
      { session, prisma }: GraphQLContext
    ): Promise<ConversationPopulated[]> => {
      if (!session.user) {
        throw new ApolloError("Not authorized.");
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
        console.log("conversations ERROR", err);
        throw new ApolloError(err.message);
      }
    },
  },
  Mutation: {
    createConversation: async (
      _: any,
      { participantsIds }: { participantsIds: string[] },
      { session, prisma, pubsub }: GraphQLContext
    ): Promise<{ conversationId: string }> => {
      if (!session.user) {
        throw new ApolloError("Not authorized.");
      }

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

        pubsub.publish("CONVERSATION_CREATED", {
          conversationCreated: conversation,
        });

        return {
          conversationId: conversation.id,
        };
      } catch (err) {
        console.log("createConversation ERROR", err);
        throw new ApolloError("Error creating conversation");
      }
    },
  },
  Subscription: {
    conversationCreated: {
      subscribe: (_: any, __: any, { pubsub }: GraphQLContext) =>
        pubsub.asyncIterator(["CONVERSATION_CREATED"]),
    },
  },
};

export const participantPopulated =
  Prisma.validator<Prisma.ConversationParticipantInclude>()({
    user: {
      select: {
        id: true,
        username: true,
      },
    },
  });

export const conversationPopulated =
  Prisma.validator<Prisma.ConversationInclude>()({
    participants: {
      include: participantPopulated,
    },
    latestMessage: {
      include: {
        sender: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    },
  });

export default resolvers;
