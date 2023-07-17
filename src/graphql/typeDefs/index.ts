import { DateTimeTypeDefinition } from "graphql-scalars";
import userTypeDefs from "./user";
import conversationTypeDefs from "./conversation";
import messagesTypeDefs from "./messages";

const typeDefs = [
  DateTimeTypeDefinition,
  userTypeDefs,
  conversationTypeDefs,
  messagesTypeDefs,
];

export default typeDefs;
