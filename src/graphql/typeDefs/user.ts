import gql from "graphql-tag";

const typeDefs = gql`
  type User {
    id: ID
    name: String
    username: String
    email: String
    emailVerified: Boolean
    image: String
    createdAt: DateTime
  }

  type Query {
    searchUsers(query: String): [User]
  }

  type Mutation {
    createUsername(username: String): CreateUsernameResponse
  }

  type CreateUsernameResponse {
    success: Boolean
    error: String
  }
`;

export default typeDefs;
