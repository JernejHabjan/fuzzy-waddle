import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiPlanId } from "../contracts/ai-core-types";
import type { AiSquadStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiDomainV1, AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { movementDomains } from "./ai-tactics-geometry";

export function splitDomainSquads(
  squads: readonly AiSquadStateV1[],
  actorById: ReadonlyMap<ActorId, AiObservedActorV1>
): AiSquadStateV1[] {
  const split = squads.flatMap((squad) => {
    const groups = new Map<AiDomainV1, ActorId[]>();
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
      squadId: index === 0 ? squad.squadId : (`${squad.squadId}:domain:${domain}` as AiSquadStateV1["squadId"]),
      domain,
      actorIds
    }));
  });
  // A reinforced parent can generate a child ID that already owns surviving members.
  const merged = new Map<AiSquadStateV1["squadId"], AiSquadStateV1>();
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
  observation: AiObservationV1,
  squad: AiSquadStateV1,
  suffix: string,
  utility: number
): Pick<
  AiIntentV1,
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
    intentId: `intent:stage13:${observation.generation}:${squad.squadId}:${suffix}` as AiIntentV1["intentId"],
    effectId: `effect:stage13:${squad.squadId}:${suffix}:${observation.tick}` as AiIntentV1["effectId"],
    planId,
    demandId: null,
    lane: "army_threat",
    proposedTick: observation.tick,
    urgencyClass: squad.role === "defense" ? 1 : 4,
    utility,
    preconditions: [{ kind: "plan_active", planId }],
    claims: squad.actorIds.map((actorId) => ({
      claimId: `claim:stage13:actor:${actorId}` as AiIntentV1["claims"][number]["claimId"],
      kind: "actor" as const,
      actorId
    })),
    reasonCode: `stage13:${suffix}`
  };
}

export function boundedTacticalIntents(intents: readonly AiIntentV1[], actorOrderLimit: number): readonly AiIntentV1[] {
  const accepted: AiIntentV1[] = [];
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
