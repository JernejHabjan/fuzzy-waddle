import type { MissionParticipantDefinition } from "../contracts/mission-participant-definition";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { MissionCoopOverride } from "../contracts/mission-coop-override";
import { resolveMissionParticipants } from "./campaign-coop-policy";

/**
 * Defines the structured campaign participant launch slot contract for this module. Its declared surface makes
 * participant, player number, player position, team number explicit to every consumer. Use this shared shape
 * rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignParticipantLaunchSlot {
  /**
   * participant value carried by {@link CampaignParticipantLaunchSlot}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly participant: MissionParticipantDefinition;
  /**
   * numeric player number carried by {@link CampaignParticipantLaunchSlot}. Its units and valid range are
   * defined by {@link CampaignParticipantLaunchSlot} and must remain consistent across producers and consumers.
   */
  readonly playerNumber: number;
  /**
   * numeric player position carried by {@link CampaignParticipantLaunchSlot}. Its units and valid range are
   * defined by {@link CampaignParticipantLaunchSlot} and must remain consistent across producers and consumers.
   */
  readonly playerPosition: number;
  /**
   * numeric team number carried by {@link CampaignParticipantLaunchSlot}. Its units and valid range are defined
   * by {@link CampaignParticipantLaunchSlot} and must remain consistent across producers and consumers.
   */
  readonly teamNumber: number;
}

/** Documents the update campaign participant teams member and its declared contract at this boundary. */
export function updateCampaignParticipantTeams(
  participantTeams: Record<string, number>,
  playerNumber: number,
  otherPlayerNumber: number,
  allied: boolean
): void {
  const playerTeam = participantTeams[String(playerNumber)] ?? playerNumber;
  const otherTeam = participantTeams[String(otherPlayerNumber)] ?? otherPlayerNumber;
  if (allied) {
    const team = Math.min(playerTeam, otherTeam);
    participantTeams[String(playerNumber)] = team;
    participantTeams[String(otherPlayerNumber)] = team;
  } else if (playerTeam === otherTeam) {
    participantTeams[String(otherPlayerNumber)] = otherPlayerNumber;
  }
}

/** Documents the resolve campaign participant launch slots member and its declared contract at this boundary. */
export function resolveCampaignParticipantLaunchSlots(
  participants: readonly MissionParticipantDefinition[],
  options?: { readonly coop?: MissionCoopOverride; readonly humanParticipantCount?: number }
): readonly CampaignParticipantLaunchSlot[] {
  const resolvedParticipants = options
    ? resolveMissionParticipants(participants, options.coop, options.humanParticipantCount ?? 1)
    : participants;
  const teamIds = [...new Set(resolvedParticipants.map((participant) => String(participant.teamId)))].sort();
  const teamNumberById = new Map(teamIds.map((teamId, index) => [teamId, index + 1] as const));
  return resolvedParticipants.map((participant, index) => {
    const teamNumber = teamNumberById.get(String(participant.teamId));
    if (teamNumber === undefined) throw new Error(`Campaign team '${participant.teamId}' was not resolved`);
    return {
      participant,
      playerNumber: index + 1,
      playerPosition: index,
      teamNumber
    };
  });
}

export function validateCampaignParticipants(participants: readonly MissionParticipantDefinition[]): readonly string[] {
  const errors: string[] = [];
  if (participants.length > 8)
    errors.push(`Campaign missions support at most eight participants; found ${participants.length}`);
  const slotIds = new Set<string>();
  let humanCount = 0;
  for (const participant of participants) {
    if (slotIds.has(participant.slotId)) errors.push(`Duplicate participant slot '${participant.slotId}'`);
    slotIds.add(participant.slotId);
    if (participant.controller === "human") humanCount++;
    if (participant.economy === "granted" && participant.startingResources === undefined) {
      errors.push(`Granted economy participant '${participant.slotId}' requires startingResources`);
    }
    for (const [resource, amount] of Object.entries(participant.startingResources ?? {})) {
      if (!Object.values(ResourceType).includes(resource as ResourceType)) {
        errors.push(`Unknown resource '${resource}' for '${participant.slotId}'`);
      }
      if (!Number.isFinite(amount) || amount < 0) errors.push(`Invalid ${resource} grant for '${participant.slotId}'`);
    }
  }
  if (participants.length > 0 && (humanCount < 1 || humanCount > 2)) {
    errors.push(`Campaign missions require one or two human participant slots; found ${humanCount}`);
  }
  const humanParticipants = participants.filter((participant) => participant.controller === "human");
  for (const participant of humanParticipants.slice(1)) {
    if (!participant.singlePlayerSubstitution) {
      errors.push(`Co-op participant '${participant.slotId}' requires a singlePlayerSubstitution`);
    }
  }
  return errors;
}
