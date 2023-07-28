import merge from "lodash.merge";
import { DateTimeResolver } from "graphql-scalars";
import userResolvers from "./user";
import conversationResolvers from "./conversation";
import messageResolvers from "./message";

const resolvers = merge(
  {},
  { DateTime: DateTimeResolver },
  userResolvers,
  conversationResolvers,
  messageResolvers
);

export default resolvers;
