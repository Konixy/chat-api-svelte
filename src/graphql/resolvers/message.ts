import { GraphQLContext, Message, SendMessageArguments } from "../../lib/types";
import { userIsConversationParticipant } from "../../lib/util";
import { Prisma } from "@prisma/client";
import { GraphQLError } from "graphql";
import { withFilter } from "graphql-subscriptions";
import { conversationPopulated } from "./conversation";

const resolvers = {
  Query: {
    messages: async function (
      _: any,
      { conversationId }: { conversationId: string },
      { session, prisma }: GraphQLContext
    ): Promise<Message[]> {
      if (!session?.user) {
        throw new GraphQLError("Not authorized.");
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
        throw new GraphQLError("Conversation Not Found");
      }

      if (!userIsConversationParticipant(conversation.participants, userId)) {
        throw new GraphQLError("Not authorized.");
      }

      try {
        const messages = await prisma.message.findMany({
          where: {
            conversationId,
          },
          include: messagePopulated,
          orderBy: {
            createdAt: "desc",
          },
        });

        await prisma.conversation.update({
          where: {
            id: conversationId,
          },
          data: {
            participants: {
              update: {
                where: {
                  id: conversation.participants.find(
                    (p) => p.user.id === session.user.id
                  ).id,
                },
                data: {
                  hasSeenAllMessages: true,
                },
              },
            },
          },
        });

        return messages;
      } catch (err) {
        console.log("messages ERROR", err);
        throw new GraphQLError(
          "There was an error while trying to fetch messages"
        );
      }
    },
  },
  Mutation: {
    sendMessage: async function (
      _: any,
      { id: messageId, senderId, conversationId, body }: SendMessageArguments,
      { session, prisma, pubsub }: GraphQLContext
    ): Promise<boolean> {
      if (!session?.user) {
        throw new GraphQLError("Not authorized.");
      }

      const {
        user: { id: userId },
      } = session;

      if (userId !== senderId) {
        throw new GraphQLError("Not authorized.");
      }

      try {
        const newMessage = await prisma.message.create({
          data: {
            id: messageId,
            senderId,
            conversationId,
            body,
          },
          include: messagePopulated,
        });

        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            userId: senderId,
            conversationId,
          },
        });

        if (!participant) throw new GraphQLError("Participant does not exist.");

        const conversation = await prisma.conversation.update({
          where: {
            id: conversationId,
          },
          data: {
            latestMessageId: newMessage.id,
            participants: {
              update: {
                where: {
                  id: participant.id,
                },
                data: {
                  hasSeenAllMessages: true,
                },
              },
              updateMany: {
                where: {
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

        pubsub.publish("MESSAGE_SENT", { messageSent: newMessage });
        // pubsub.publish("CONVERSATION_UPDATED", {
        //   conversationUpdated: {
        //     conversation,
        //   },
        // });
      } catch (err) {
        console.log("sendMessage ERROR", err);
        throw new GraphQLError("Error sending message");
      }

      return true;
    },
  },
  Subscription: {
    messageSent: {
      subscribe: withFilter(
        (_: any, __: any, { pubsub }: GraphQLContext) =>
          pubsub.asyncIterator(["MESSAGE_SENT"]),
        (
          payload: MessageSentSubscriptionPayload,
          { conversationId }: { conversationId: string },
          { session }: GraphQLContext
        ) => payload.messageSent.conversationId === conversationId
      ),
    },
  },
};

type MessageSentSubscriptionPayload = {
  messageSent: Message;
};

export const messagePopulated = Prisma.validator<Prisma.MessageInclude>()({
  sender: {
    select: {
      id: true,
      username: true,
    },
  },
});

export default resolvers;
