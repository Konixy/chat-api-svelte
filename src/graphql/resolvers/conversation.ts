import { ApolloError } from "apollo-server-core";
import { GraphQLContext } from "../../lib/types";
import { Prisma } from "@prisma/client";

const resolvers = {
  Query: {
    conversations: async (
      _: any,
      __: any,
      { session, prisma }: GraphQLContext
    ) => {
      console.log("inside conversations query");
    },
  },
  Mutation: {
    createConversation: async (
      _: any,
      { participantsIds }: { participantsIds: string[] },
      { session, prisma }: GraphQLContext
    ): Promise<{ conversationId: string }> => {
      console.log(participantsIds);

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

        return {
          conversationId: conversation.id,
        };
      } catch (err) {
        console.log("createConversation ERROR", err);
        throw new ApolloError("Error creating conversation");
      }
    },
  },
  // Subscription: {},
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
