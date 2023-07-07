import userResolvers from "./user";
import merge from "lodash.merge";
import { DateTimeResolver } from "graphql-scalars";

const resolvers = merge({}, { DateTime: DateTimeResolver }, userResolvers);

export default resolvers;
