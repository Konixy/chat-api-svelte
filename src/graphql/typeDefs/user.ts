import gql from 'graphql-tag';

const typeDefs = gql`
  type User {
    id: ID
    username: String
    name: String
    image: String
    createdAt: DateTime
    updatedAt: DateTime
    email: String
    emailVerified: Boolean
  }

  type Query {
    getUsers: [User]
    getUser(id: String!): User
    searchUsers(query: String!): [User]
  }

  type Mutation {
    createUsername(username: String): Boolean
  }

  type CreateUsernameResponse {
    success: Boolean
    error: String
  }
`;

export default typeDefs;
