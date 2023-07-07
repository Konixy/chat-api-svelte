import userTypeDefs from "./user";
import { DateTimeTypeDefinition } from "graphql-scalars";

const typeDefs = [DateTimeTypeDefinition, userTypeDefs];

export default typeDefs;
