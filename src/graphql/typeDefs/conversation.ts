import { gql } from "apollo-server-core";

const typeDefs = gql`
  type Mutation {
    createConversation(participantsIds: [String]): CreateConversationResponse
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

  type Subscription {
    conversationCreated: Conversation
  }
`;

export default typeDefs;
