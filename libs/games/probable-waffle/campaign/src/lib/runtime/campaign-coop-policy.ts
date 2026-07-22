import type { CampaignMissionRuntimeEvent, FactionType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { MissionParticipantSlotId, ScenarioGroupId } from "../contracts/campaign-content-id";
import type {
  MissionCoopOverride,
  MissionFailurePolicy,
  MissionTriggerParticipantPolicy
} from "../contracts/mission-coop-override";
import type { MissionParticipantDefinition } from "../contracts/mission-participant-definition";

export interface ResolvedMissionParticipant extends MissionParticipantDefinition {
  readonly playerNumber: number;
}

export interface MissionTriggerParticipantContext {
  readonly event?: CampaignMissionRuntimeEvent;
  readonly participants: readonly ResolvedMissionParticipant[];
  readonly connectedHumanPlayerNumbers: readonly number[];
  readonly participatingPlayerNumbers?: readonly number[];
  readonly requiredGroupPlayerNumbers?: Readonly<Partial<Record<ScenarioGroupId, readonly number[]>>>;
}

export interface MissionFailureContext {
  readonly requiredHeroPlayerNumbers: readonly number[];
  readonly defeatedHeroPlayerNumbers: readonly number[];
  readonly requiredTeamPlayerNumbers: readonly number[];
  readonly eliminatedPlayerNumbers: readonly number[];
}

export interface CampaignParticipantRebinding {
  readonly slotId: MissionParticipantSlotId;
  readonly savedPlayerNumber: number;
  readonly currentPlayerNumber: number;
}

/** Resolves co-op overrides and deterministic single-player substitutions without using local user identity. */
export function resolveMissionParticipants(
  base: readonly MissionParticipantDefinition[],
  coop: MissionCoopOverride | undefined,
  humanParticipantCount: number
): readonly ResolvedMissionParticipant[] {
  const overrides = new Map(coop?.participants.map((participant) => [participant.slotId, participant]) ?? []);
  let retainedHumans = 0;
  const resolved: MissionParticipantDefinition[] = [];
  for (const participant of base) {
    const override = overrides.get(participant.slotId);
    const merged = { ...participant, ...override, slotId: participant.slotId };
    if (merged.controller === "human") {
      retainedHumans += 1;
      if (retainedHumans > humanParticipantCount) {
        const substitute = merged.singlePlayerSubstitution ?? "absent";
        if (substitute === "absent") continue;
        resolved.push({ ...merged, controller: substitute });
        continue;
      }
    }
    resolved.push(merged);
  }
  return resolved.map((participant, index) => ({ ...participant, playerNumber: index + 1 }));
}

export function evaluateMissionTriggerParticipantPolicy(
  policy: MissionTriggerParticipantPolicy | undefined,
  context: MissionTriggerParticipantContext
): boolean {
  if (!context.event || !policy || policy.kind === "any-player") return true;
  const initiator = context.event.initiatorPlayerNumber;
  const participant = context.participants.find((candidate) => candidate.playerNumber === initiator);
  switch (policy.kind) {
    case "specific-slot":
      return participant?.slotId === policy.slotId;
    case "specific-faction":
      return context.event.initiatorFaction === factionName(policy.faction);
    case "all-connected-humans":
      return containsEvery(context.participatingPlayerNumbers ?? [], context.connectedHumanPlayerNumbers);
    case "at-least":
      return unique(context.participatingPlayerNumbers ?? (initiator === undefined ? [] : [initiator])).length >= policy.count;
    case "entire-required-group":
      return containsEvery(
        context.participatingPlayerNumbers ?? [],
        context.requiredGroupPlayerNumbers?.[policy.groupId] ?? []
      );
  }
}

export function missionFailureReached(policy: MissionFailurePolicy, context: MissionFailureContext): boolean {
  switch (policy) {
    case "any-required-hero":
      return context.requiredHeroPlayerNumbers.some((playerNumber) =>
        context.defeatedHeroPlayerNumbers.includes(playerNumber)
      );
    case "all-required-heroes":
      return containsEvery(context.defeatedHeroPlayerNumbers, context.requiredHeroPlayerNumbers);
    case "team-eliminated":
      return containsEvery(context.eliminatedPlayerNumbers, context.requiredTeamPlayerNumbers);
    case "mission-defined":
      return false;
  }
}

/** Save ownership is host-scoped, but load rebinding intentionally depends on slots and count rather than account IDs. */
export function rebindCampaignParticipants(
  saved: readonly { readonly slotId: MissionParticipantSlotId; readonly playerNumber: number }[],
  current: readonly { readonly slotId: MissionParticipantSlotId; readonly playerNumber: number }[]
): readonly CampaignParticipantRebinding[] | undefined {
  if (saved.length !== current.length) return undefined;
  const savedBySlot = new Map(saved.map((participant) => [participant.slotId, participant.playerNumber]));
  const result: CampaignParticipantRebinding[] = [];
  for (const participant of current) {
    const savedPlayerNumber = savedBySlot.get(participant.slotId);
    if (savedPlayerNumber === undefined) return undefined;
    result.push({
      slotId: participant.slotId,
      savedPlayerNumber,
      currentPlayerNumber: participant.playerNumber
    });
  }
  return result.sort((left, right) => String(left.slotId).localeCompare(String(right.slotId)));
}

function containsEvery(values: readonly number[], required: readonly number[]): boolean {
  if (required.length === 0) return false;
  const available = new Set(values);
  return unique(required).every((value) => available.has(value));
}

function unique(values: readonly number[]): number[] {
  return [...new Set(values)].sort((left, right) => left - right);
}

function factionName(faction: FactionType): "tivara" | "skaduwee" | undefined {
  if (faction === 1) return "tivara";
  if (faction === 2) return "skaduwee";
  return undefined;
}
