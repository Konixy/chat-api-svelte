import gql from 'graphql-tag';

const typeDefs = gql`
  type Message {
    id: ID
    sender: User
    body: String
    conversationId: String
    createdAt: DateTime
    updatedAt: DateTime
  }

  type Query {
    messages(conversationId: String): [Message]
  }

  type Mutation {
    sendMessage(id: String, conversationId: String, senderId: String, body: String): Boolean
  }

  type Subscription {
    newMessage: Message
  }
`;

export default typeDefs;
