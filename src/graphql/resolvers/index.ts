import merge from "lodash.merge";
import { DateTimeResolver } from "graphql-scalars";
import userResolvers from "./user";
import conversationResolvers from "./conversation";

const resolvers = merge(
  {},
  { DateTime: DateTimeResolver },
  userResolvers,
  conversationResolvers
);

export default resolvers;
