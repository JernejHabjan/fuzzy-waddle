import type { CampaignMissionRuntimeEvent, FactionType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { MissionParticipantSlotId, ScenarioGroupId } from "../contracts/campaign-content-id";
import type {
  MissionCoopOverride,
  MissionFailurePolicy,
  MissionTriggerParticipantPolicy
} from "../contracts/mission-coop-override";
import type { MissionParticipantDefinition } from "../contracts/mission-participant-definition";

/**
 * Resolved participant contract shared by solo, host, and future co-op execution. It
 * preserves authored slot identity while assigning concrete player numbers/team policy,
 * so mission triggers and failure rules never depend on who happened to connect first.
 * Transport is intentionally absent: save, replay, and reconnect can reproduce the same
 * decision from slots/count before any client identity is available.
 */
export interface ResolvedMissionParticipant extends MissionParticipantDefinition {
  /**
   * numeric player number carried by {@link ResolvedMissionParticipant}. Its units and valid range are defined
   * by {@link ResolvedMissionParticipant} and must remain consistent across producers and consumers.
   */
  readonly playerNumber: number;
}

/**
 * Defines the structured mission trigger participant context contract for this module. Its declared surface
 * makes event, participants, connected human player numbers, participating player numbers, required group
 * player numbers explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface MissionTriggerParticipantContext {
  /**
   * Optional event value carried by {@link MissionTriggerParticipantContext}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly event?: CampaignMissionRuntimeEvent;
  /**
   * collection owned by {@link MissionTriggerParticipantContext}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly participants: readonly ResolvedMissionParticipant[];
  /**
   * collection value on {@link MissionTriggerParticipantContext}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly connectedHumanPlayerNumbers: readonly number[];
  /**
   * Optional collection value on {@link MissionTriggerParticipantContext}. Its element type defines the records
   * that may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly participatingPlayerNumbers?: readonly number[];
  /**
   * Optional collection value on {@link MissionTriggerParticipantContext}. Its element type defines the records
   * that may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly requiredGroupPlayerNumbers?: Readonly<Partial<Record<ScenarioGroupId, readonly number[]>>>;
}

/**
 * Defines the structured mission failure context contract for this module. Its declared surface makes required
 * hero player numbers, defeated hero player numbers, required team player numbers, eliminated player numbers
 * explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and
 * callers remain compatible.
 */
export interface MissionFailureContext {
  /**
   * collection value on {@link MissionFailureContext}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly requiredHeroPlayerNumbers: readonly number[];
  /**
   * collection value on {@link MissionFailureContext}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly defeatedHeroPlayerNumbers: readonly number[];
  /**
   * collection value on {@link MissionFailureContext}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly requiredTeamPlayerNumbers: readonly number[];
  /**
   * collection value on {@link MissionFailureContext}. Its element type defines the records that may cross this
   * boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly eliminatedPlayerNumbers: readonly number[];
}

/**
 * Defines the structured campaign participant rebinding contract for this module. Its declared surface makes
 * slot id, saved player number, current player number explicit to every consumer. Use this shared shape rather
 * than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignParticipantRebinding {
  /**
   * stable slot id used by {@link CampaignParticipantRebinding} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly slotId: MissionParticipantSlotId;
  /**
   * numeric saved player number carried by {@link CampaignParticipantRebinding}. Its units and valid range are
   * defined by {@link CampaignParticipantRebinding} and must remain consistent across producers and consumers.
   */
  readonly savedPlayerNumber: number;
  /**
   * numeric current player number carried by {@link CampaignParticipantRebinding}. Its units and valid range are
   * defined by {@link CampaignParticipantRebinding} and must remain consistent across producers and consumers.
   */
  readonly currentPlayerNumber: number;
}

/** Documents the resolve mission participants member and its declared contract at this boundary. */
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
      return (
        unique(context.participatingPlayerNumbers ?? (initiator === undefined ? [] : [initiator])).length >=
        policy.count
      );
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

/** Documents the rebind campaign participants member and its declared contract at this boundary. */
export function rebindCampaignParticipants(
  saved: readonly { readonly slotId: string; readonly playerNumber: number }[],
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
