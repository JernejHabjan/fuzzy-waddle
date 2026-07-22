import type { FactionType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { MissionParticipantSlotId, MissionTeamId, ScenarioGroupId } from "./campaign-content-id";
import type { MissionParticipantDefinition } from "./mission-participant-definition";

export type MissionFailurePolicy = "any-required-hero" | "all-required-heroes" | "team-eliminated" | "mission-defined";

export type MissionTriggerParticipantPolicy =
  | { readonly kind: "any-player" }
  | { readonly kind: "specific-slot"; readonly slotId: MissionParticipantSlotId }
  | { readonly kind: "specific-faction"; readonly faction: FactionType }
  | { readonly kind: "all-connected-humans" }
  | { readonly kind: "at-least"; readonly count: number }
  | { readonly kind: "entire-required-group"; readonly groupId: ScenarioGroupId };

export interface MissionParticipantOverride extends Partial<Omit<MissionParticipantDefinition, "slotId">> {
  readonly slotId: MissionParticipantSlotId;
  readonly teamId?: MissionTeamId;
}

export interface MissionPlayerCountOverride {
  readonly participantCount: number;
  readonly waveSizeScale?: number;
  readonly resourceScale?: number;
}

export interface MissionCoopOverride {
  readonly schemaVersion: 1;
  readonly participants: readonly MissionParticipantOverride[];
  readonly playerCountDifficulty: readonly MissionPlayerCountOverride[];
  readonly failurePolicy: MissionFailurePolicy;
  readonly disconnectedPlayerPolicy: "pause-for-reconnect" | "mission-defined";
}
