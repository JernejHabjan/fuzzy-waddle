import type { CampaignId } from "@fuzzy-waddle/probable-waffle-protocol";
import type { MissionCinematicId } from "../contracts/campaign-content-id";
import type { MissionCinematicDefinition, MissionDialogueBundle } from "../contracts/mission-dialogue-bundle";

export const CAMPAIGN_CINEMATIC_HOLD_SKIP_MS = 3_000;
export const CAMPAIGN_CINEMATIC_VOTE_EXPIRY_MS = 10_000;

export interface MissionCinematicPresentationRequest {
  readonly campaignId: CampaignId;
  readonly ownerToken: string;
  readonly definition: MissionCinematicDefinition;
  readonly dialogue: MissionDialogueBundle;
  readonly previouslySeen: boolean;
  readonly resumeCueIndex?: number;
}

export interface MissionCinematicPresentationSnapshot {
  readonly cinematicId: MissionCinematicId;
  readonly ownerToken: string;
  readonly cueIndex: number;
  readonly stage: "presenting" | "finalizing";
}

export abstract class CampaignCinematicPresentationService {
  abstract play(request: MissionCinematicPresentationRequest): void;
  abstract requestSkip(held: boolean): void;
  abstract restore(snapshot: MissionCinematicPresentationSnapshot): void;
  abstract destroy(): void;
}

export interface CampaignSeenCinematicStore {
  hasSeen(campaignId: CampaignId, cinematicId: MissionCinematicId): boolean;
  markSeen(campaignId: CampaignId, cinematicId: MissionCinematicId): void;
}

export interface CampaignCinematicSkipVote {
  readonly participantId: string;
  readonly requestedAtMs: number;
}

export interface CampaignCinematicSkipConsensus {
  readonly status: "pending" | "accepted" | "expired";
  readonly missingParticipantIds: readonly string[];
}

export interface CampaignCinematicSkipVotePort {
  requestVote(cinematicId: MissionCinematicId): void;
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
