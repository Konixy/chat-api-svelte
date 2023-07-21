import gql from "graphql-tag";

const typeDefs = gql`
  type Message {
    id: ID
    sender: User
    body: String
    createdAt: DateTime
    updatedAt: DateTime
  }
`;

export default typeDefs;
