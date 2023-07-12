import { DateTimeTypeDefinition } from "graphql-scalars";
import userTypeDefs from "./user";
import conversationTypeDefs from "./conversation";

const typeDefs = [DateTimeTypeDefinition, userTypeDefs, conversationTypeDefs];

export default typeDefs;
