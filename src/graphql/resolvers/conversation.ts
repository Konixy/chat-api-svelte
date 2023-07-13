import { ApolloError } from "apollo-server-core";
import { GraphQLContext } from "../../lib/types";

const resolvers = {
  Mutation: {
    createConversation: async (
      _: any,
      { participantsIds }: { participantsIds: string[] },
      { session, prisma }: GraphQLContext
    ) => {
      console.log(participantsIds);

      throw new ApolloError("Function not implemented");
    },
  },
  // Subscription: {},
};

export default resolvers;
