import { ParticipantPopulated } from "./types";

export function userIsConversationParticipant(
  participants: ParticipantPopulated[],
  userId: string
) {
  return !!participants.find((p) => p.userId === userId);
}
