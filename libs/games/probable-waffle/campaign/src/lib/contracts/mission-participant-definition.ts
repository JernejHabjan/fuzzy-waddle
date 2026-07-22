import type { FactionType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { MissionParticipantSlotId, MissionTeamId } from "./campaign-content-id";

export interface MissionParticipantDefinition {
  readonly slotId: MissionParticipantSlotId;
  readonly controller: "human" | "full-ai" | "scripted-ai" | "passive";
  /** A future co-op human slot uses this controller when the mission is launched by one human. */
  readonly singlePlayerSubstitution?: "absent" | "scripted-ai" | "full-ai";
  readonly faction: FactionType;
  readonly teamId: MissionTeamId;
  readonly requiredForVictory?: boolean;
  readonly profileOwnership?: "independent" | "none";
  readonly economy: "normal" | "granted" | "none";
  readonly fogPolicy: "normal" | "revealed" | "omniscient-ai";
  readonly startingResources?: Readonly<Partial<Record<ResourceType, number>>>;
}
