import gql from 'graphql-tag';

const typeDefs = gql`
  type Mutation {
    createConversation(participantsIds: [String]): CreateConversationResponse
    markConversationAsRead(conversationId: String!): Boolean
    deleteConversation(conversationId: String!): Boolean
  }

  type CreateConversationResponse {
    conversationId: ID
  }

  type Conversation {
    id: ID
    latestMessage: Message
    participants: [Participant]
    createdAt: DateTime
    updatedAt: DateTime
  }

  type Participant {
    id: ID
    user: User
    hasSeenAllMessages: Boolean
  }

  type Query {
    conversations: [Conversation]
  }

  type ConversationDeletedSubscriptionPayload {
    id: String
  }

  type Subscription {
    conversationUpdated: Conversation
    conversationDeleted: ConversationDeletedSubscriptionPayload
  }
`;

export default typeDefs;
