import gql from 'graphql-tag';

const typeDefs = gql`
  type Query {
    conversations: [Conversation]
  }

  type Mutation {
    createConversation(participantsIds: [String]): CreateConversationResponse
    markConversationAsRead(conversationId: String!): Boolean
    deleteConversation(conversationId: String!): Boolean
    leaveConversation(conversationId: String!): Boolean
    addParticipants(conversationId: String!, userIds: [String]!): Boolean
  }

  type Subscription {
    conversationUpdated: ConversationUpdatedSubscriptionPayload
    # conversationDeleted: ConversationDeletedSubscriptionPayload
    # conversationParticipantDeleted: ConversationParticipantDeletedSubscriptionPayload
  }

  type CreateConversationResponse {
    conversationId: ID
  }

  type Conversation {
    id: ID
    name: String
    latestMessage: Message
    participants: [Participant]
    createdAt: DateTime
    updatedAt: DateTime
  }

  type Participant {
    id: ID
    user: User
    lastSeenMessageId: ID
    unreadMessages: Int
  }

  type ConversationUpdatedSubscriptionPayload {
    oldConversation: Conversation
    newConversation: Conversation
  }

  # type ConversationDeletedSubscriptionPayload {
  #   id: String
  # }

  # type ConversationParticipantDeletedSubscriptionPayload {
  #   participantId: String
  #   oldConversation: Conversation
  #   newConversation: Conversation
  # }
`;

export default typeDefs;
