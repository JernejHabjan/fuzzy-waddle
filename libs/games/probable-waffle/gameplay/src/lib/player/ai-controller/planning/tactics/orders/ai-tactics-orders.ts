import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiPlanId } from "../../../contracts/ai-core-types";
import type { AiSquadState } from "../../../contracts/state/ai-state-contracts";
import type { AiIntent } from "../../../contracts/commands/ai-intent";
import type { AiDomain, AiObservation, AiObservedActor } from "../../../contracts/observation/ai-observation";
import { movementDomains } from "../combat/ai-tactics-geometry";

export function splitDomainSquads(
  squads: readonly AiSquadState[],
  actorById: ReadonlyMap<ActorId, AiObservedActor>
): AiSquadState[] {
  const split = squads.flatMap((squad) => {
    const groups = new Map<AiDomain, ActorId[]>();
    for (const actorId of squad.actorIds) {
      const actor = actorById.get(actorId);
      const domain = actor
        ? (movementDomains(actor)[0] ?? "ground")
        : squad.domain === "mixed"
          ? "ground"
          : squad.domain;
      groups.set(domain, [...(groups.get(domain) ?? []), actorId]);
    }
    const ordered = [...groups.entries()].sort((left, right) => left[0].localeCompare(right[0]));
    if (ordered.length <= 1) return [squad];
    return ordered.map(([domain, actorIds], index) => ({
      ...squad,
      squadId: index === 0 ? squad.squadId : (`${squad.squadId}:domain:${domain}` as AiSquadState["squadId"]),
      domain,
      actorIds
    }));
  });
  // A reinforced parent can generate a child ID that already owns surviving members.
  const merged = new Map<AiSquadState["squadId"], AiSquadState>();
  for (const squad of split) {
    const existing = merged.get(squad.squadId);
    merged.set(
      squad.squadId,
      existing ? { ...existing, actorIds: [...new Set([...existing.actorIds, ...squad.actorIds])].sort() } : squad
    );
  }
  return [...merged.values()];
}

export function intentBase(
  observation: AiObservation,
  squad: AiSquadState,
  suffix: string,
  utility: number
): Pick<
  AiIntent,
  | "intentId"
  | "effectId"
  | "planId"
  | "demandId"
  | "lane"
  | "proposedTick"
  | "urgencyClass"
  | "utility"
  | "preconditions"
  | "claims"
  | "reasonCode"
> {
  const planId = `plan:${squad.squadId}` as AiPlanId;
  return {
    intentId: `intent:stage13:${observation.generation}:${squad.squadId}:${suffix}` as AiIntent["intentId"],
    effectId: `effect:stage13:${squad.squadId}:${suffix}:${observation.tick}` as AiIntent["effectId"],
    planId,
    demandId: null,
    lane: "army_threat",
    proposedTick: observation.tick,
    urgencyClass: squad.role === "defense" ? 1 : 4,
    utility,
    preconditions: [{ kind: "plan_active", planId }],
    claims: squad.actorIds.map((actorId) => ({
      claimId: `claim:stage13:actor:${actorId}` as AiIntent["claims"][number]["claimId"],
      kind: "actor" as const,
      actorId
    })),
    reasonCode: `stage13:${suffix}`
  };
}

export function boundedTacticalIntents(intents: readonly AiIntent[], actorOrderLimit: number): readonly AiIntent[] {
  const accepted: AiIntent[] = [];
  let actorOrders = 0;
  for (const intent of [...intents].sort(
    (left, right) =>
      left.urgencyClass - right.urgencyClass ||
      right.utility - left.utility ||
      left.intentId.localeCompare(right.intentId)
  )) {
    const count = "actorIds" in intent ? intent.actorIds.length : "actorId" in intent ? 1 : 0;
    if (actorOrders + count > Math.max(1, actorOrderLimit)) continue;
    accepted.push(intent);
    actorOrders += count;
  }
  return accepted;
}
