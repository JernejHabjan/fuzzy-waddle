import type { CampaignId } from "@fuzzy-waddle/probable-waffle-protocol";
import type { MissionCinematicId } from "../contracts/campaign-content-id";
import type { MissionCinematicDefinition, MissionDialogueBundle } from "../contracts/mission-dialogue-bundle";

export const CAMPAIGN_CINEMATIC_HOLD_SKIP_MS = 3_000;
export const CAMPAIGN_CINEMATIC_VOTE_EXPIRY_MS = 10_000;

/**
 * Defines the structured mission cinematic presentation request contract for this module. Its declared surface
 * makes campaign id, owner token, definition, dialogue, previously seen explicit to every consumer. Use this
 * shared shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionCinematicPresentationRequest {
  /**
   * stable campaign id used by {@link MissionCinematicPresentationRequest} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly campaignId: CampaignId;
  /**
   * string owner token carried by {@link MissionCinematicPresentationRequest}. Treat it according to the owning
   * contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly ownerToken: string;
  /**
   * definition value carried by {@link MissionCinematicPresentationRequest}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly definition: MissionCinematicDefinition;
  /**
   * dialogue value carried by {@link MissionCinematicPresentationRequest}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly dialogue: MissionDialogueBundle;
  /**
   * previously seen value carried by {@link MissionCinematicPresentationRequest}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly previouslySeen: boolean;
  /**
   * Optional numeric resume cue index carried by {@link MissionCinematicPresentationRequest}. Its units and
   * valid range are defined by {@link MissionCinematicPresentationRequest} and must remain consistent across
   * producers and consumers.
   */
  readonly resumeCueIndex?: number;
}

/**
 * Defines the structured mission cinematic presentation snapshot contract for this module. Its declared
 * surface makes cinematic id, owner token, cue index, stage explicit to every consumer. Use this shared shape
 * rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionCinematicPresentationSnapshot {
  /**
   * stable cinematic id used by {@link MissionCinematicPresentationSnapshot} to correlate this value with
   * related records, events, or authored content; it is not a display label.
   */
  readonly cinematicId: MissionCinematicId;
  /**
   * string owner token carried by {@link MissionCinematicPresentationSnapshot}. Treat it according to the owning
   * contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly ownerToken: string;
  /**
   * numeric cue index carried by {@link MissionCinematicPresentationSnapshot}. Its units and valid range are
   * defined by {@link MissionCinematicPresentationSnapshot} and must remain consistent across producers and
   * consumers.
   */
  readonly cueIndex: number;
  /**
   * stage value carried by {@link MissionCinematicPresentationSnapshot}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly stage: "presenting" | "finalizing";
}

export abstract class CampaignCinematicPresentationService {
  abstract play(request: MissionCinematicPresentationRequest): void;
  abstract requestSkip(held: boolean): void;
  abstract restore(snapshot: MissionCinematicPresentationSnapshot): void;
  abstract destroy(): void;
}

/**
 * Defines the structured campaign seen cinematic store contract for this module. Its declared surface makes
 * has seen, mark seen explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface CampaignSeenCinematicStore {
  /**
   * operation exposed by {@link CampaignSeenCinematicStore}. Its signature is the compatibility boundary for
   * implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  hasSeen(campaignId: CampaignId, cinematicId: MissionCinematicId): boolean;
  /**
   * operation exposed by {@link CampaignSeenCinematicStore}. Its signature is the compatibility boundary for
   * implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  markSeen(campaignId: CampaignId, cinematicId: MissionCinematicId): void;
}

/**
 * Defines the structured campaign cinematic skip vote contract for this module. Its declared surface makes
 * participant id, requested at ms explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignCinematicSkipVote {
  /**
   * stable participant id used by {@link CampaignCinematicSkipVote} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly participantId: string;
  /**
   * numeric requested at ms carried by {@link CampaignCinematicSkipVote}. Its units and valid range are defined
   * by {@link CampaignCinematicSkipVote} and must remain consistent across producers and consumers.
   */
  readonly requestedAtMs: number;
}

/**
 * Defines the structured campaign cinematic skip consensus contract for this module. Its declared surface
 * makes status, missing participant ids explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignCinematicSkipConsensus {
  /**
   * discriminator for {@link CampaignCinematicSkipConsensus}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly status: "pending" | "accepted" | "expired";
  /**
   * collection owned by {@link CampaignCinematicSkipConsensus}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly missingParticipantIds: readonly string[];
}

/**
 * Defines the structured campaign cinematic skip vote port contract for this module. Its declared surface
 * makes request vote, snapshot, restore explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignCinematicSkipVotePort {
  /**
   * operation exposed by {@link CampaignCinematicSkipVotePort}. Its signature is the compatibility boundary for
   * implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  requestVote(cinematicId: MissionCinematicId, participantId: string, requestedAtMs: number): void;
  /**
   * operation exposed by {@link CampaignCinematicSkipVotePort}. Its signature is the compatibility boundary for
   * implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  snapshot(): CampaignCinematicSkipVoteSnapshot | undefined;
  /**
   * operation exposed by {@link CampaignCinematicSkipVotePort}. Its signature is the compatibility boundary for
   * implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  restore(snapshot: CampaignCinematicSkipVoteSnapshot | undefined): void;
}

/**
 * Defines the structured campaign cinematic skip vote snapshot contract for this module. Its declared surface
 * makes cinematic id, requested at ms, votes explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignCinematicSkipVoteSnapshot {
  /**
   * stable cinematic id used by {@link CampaignCinematicSkipVoteSnapshot} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly cinematicId: MissionCinematicId;
  /**
   * numeric requested at ms carried by {@link CampaignCinematicSkipVoteSnapshot}. Its units and valid range are
   * defined by {@link CampaignCinematicSkipVoteSnapshot} and must remain consistent across producers and
   * consumers.
   */
  readonly requestedAtMs: number;
  /**
   * collection value on {@link CampaignCinematicSkipVoteSnapshot}. Its element type defines the records that may
   * cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly votes: readonly CampaignCinematicSkipVote[];
}

/** Defines the in memory campaign cinematic skip vote port contract used by this module; its declared members form the compatible boundary for linked consumers. */
export class InMemoryCampaignCinematicSkipVotePort implements CampaignCinematicSkipVotePort {
  private value?: CampaignCinematicSkipVoteSnapshot;

  requestVote(cinematicId: MissionCinematicId, participantId: string, requestedAtMs: number): void {
    const current = this.value?.cinematicId === cinematicId ? this.value : undefined;
    const votes = new Map(current?.votes.map((vote) => [vote.participantId, vote]) ?? []);
    votes.set(participantId, { participantId, requestedAtMs });
    this.value = {
      cinematicId,
      requestedAtMs: current?.requestedAtMs ?? requestedAtMs,
      votes: [...votes.values()].sort((left, right) => left.participantId.localeCompare(right.participantId))
    };
  }

  snapshot(): CampaignCinematicSkipVoteSnapshot | undefined {
    return this.value ? structuredClone(this.value) : undefined;
  }

  restore(snapshot: CampaignCinematicSkipVoteSnapshot | undefined): void {
    this.value = snapshot ? structuredClone(snapshot) : undefined;
  }
}

export function cinematicSkipInputMode(
  definition: Pick<MissionCinematicDefinition, "seenSkipPolicy">,
  previouslySeen: boolean
): "hold" | "tap" {
  return previouslySeen && definition.seenSkipPolicy === "tap" ? "tap" : "hold";
}

export function cinematicHoldProgress(startedAtMs: number | undefined, nowMs: number): number {
  if (startedAtMs === undefined) return 0;
  return Math.max(0, Math.min(1, (nowMs - startedAtMs) / CAMPAIGN_CINEMATIC_HOLD_SKIP_MS));
}

export function evaluateCinematicSkipConsensus(
  connectedParticipantIds: readonly string[],
  votes: readonly CampaignCinematicSkipVote[],
  requestedAtMs: number,
  nowMs: number
): CampaignCinematicSkipConsensus {
  const connected = [...new Set(connectedParticipantIds)].sort();
  const voting = new Set(votes.filter((vote) => vote.requestedAtMs >= requestedAtMs).map((vote) => vote.participantId));
  const missingParticipantIds = connected.filter((participantId) => !voting.has(participantId));
  if (nowMs - requestedAtMs >= CAMPAIGN_CINEMATIC_VOTE_EXPIRY_MS) {
    return { status: "expired", missingParticipantIds };
  }
  return { status: missingParticipantIds.length === 0 ? "accepted" : "pending", missingParticipantIds };
}
