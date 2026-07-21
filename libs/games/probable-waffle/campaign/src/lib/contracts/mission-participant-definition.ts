import type { FactionType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { MissionParticipantSlotId, MissionTeamId } from "./campaign-content-id";

export interface MissionParticipantDefinition {
  readonly slotId: MissionParticipantSlotId;
  readonly controller: "human" | "full-ai" | "scripted-ai" | "passive";
  readonly faction: FactionType;
  readonly teamId: MissionTeamId;
  readonly economy: "normal" | "granted" | "none";
  readonly fogPolicy: "normal" | "revealed" | "omniscient-ai";
}
