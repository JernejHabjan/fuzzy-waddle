import { aiDeadline, type AiPlanId, type AiSquadId } from "../contracts/ai-core-types";
import type { AiSquadStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiProfileConfigV1 } from "../contracts/ai-profile-config-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiSkirmishProposalContext } from "./ai-skirmish-proposal-context";
import { observedAiEconomyThreats } from "./ai-economy-policy";
import { canSeeTarget, estimateAiEngagementV1 } from "./ai-tactics-combat";
import { AI_TACTICS_ATTACK_RATIO_PERMILLE } from "./ai-tactics-rules";
import { retainAiSquadTacticsForActors } from "./ai-skirmish-tactics-ownership";
import {
  baseId,
  canTarget,
  distance,
  domains,
  intentBase,
  position,
  regionId,
  withTimeline
} from "./ai-skirmish-support";

export const AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS = 1200;
export const AI_PURSUIT_LEASH_TICKS = 200;

export function advanceAiSkirmishDefense(context: AiSkirmishProposalContext, profile: AiProfileConfigV1): void {
  const { localThreat, combat, activeDefense, state, observation, homeAccess } = context;
  if (!localThreat || combat.length === 0) return;
  let eligibleDefenders = combat.filter((actor) => canTarget(actor, localThreat));
  const questionScoutActors = new Set(
    context.activeScout?.objectiveId?.startsWith("question:") ||
      (context.activeScout?.objectiveId?.startsWith("neutral:") && context.activeScout.state === "moving")
      ? context.activeScout.actorIds
      : []
  );
  if (eligibleDefenders.length > 1 && questionScoutActors.size > 0) {
    eligibleDefenders = eligibleDefenders.filter((actor) => !questionScoutActors.has(actor.actorId));
  }
  if (eligibleDefenders.length === 0) return;
  const confirmedHome =
    context.homeBaseActor?.mainBuilding?.status === "known" && context.homeBaseActor.mainBuilding.value;
  const nearbyAttackers = context.visibleEnemies.filter((enemy) => {
    const enemyPosition = position(enemy);
    return (
      enemy.housingCost.status === "known" &&
      enemy.housingCost.value > 0 &&
      confirmedHome &&
      context.home !== undefined &&
      enemyPosition !== undefined &&
      distance(context.home, enemyPosition) <= 12
    );
  }).length;
  let defenseCount = Math.min(
    eligibleDefenders.length,
    Math.max(
      1,
      Math.ceil(eligibleDefenders.length * 0.25),
      Math.max(nearbyAttackers, observedAiEconomyThreats(observation).length) * 2
    )
  );
  // A head-count reserve can remain too weak forever even while an idle army could remove the threat.
  while (defenseCount < Math.min(eligibleDefenders.length, profile.maxLocalEngagementPairsPerStep)) {
    const estimate = estimateAiEngagementV1(
      eligibleDefenders.slice(0, defenseCount),
      [localThreat],
      profile.maxLocalEngagementPairsPerStep
    );
    if (estimate.confidencePermille < 500 || estimate.ratioPermille >= AI_TACTICS_ATTACK_RATIO_PERMILLE) break;
    defenseCount++;
  }
  const defenders = eligibleDefenders.slice(0, defenseCount);
  defenders.forEach((actor) => context.primaryOwnedActors.add(actor.actorId));
  const targetPosition = position(localThreat);
  const defenseId = activeDefense?.squadId ?? ("squad:defense:home" as AiSquadId);
  const defensePlanId = `plan:${defenseId}` as AiPlanId;
  const existingLifecycle = activeDefense?.lifecycle;
  const defense: AiSquadStateV1 = {
    squadId: defenseId,
    role: "defense",
    domain: domains(defenders[0] ?? combat[0]!).includes("air") ? "air" : "ground",
    actorIds: defenders.map((actor) => actor.actorId),
    objectiveId: localThreat.actorId,
    state: targetPosition ? "engaged" : "searching",
    ...(activeDefense?.tactics
      ? { tactics: retainAiSquadTacticsForActors(activeDefense.tactics, defenders.map((actor) => actor.actorId)) }
      : {}),
    lifecycle: {
      targetPlayerNumber: localThreat.owner,
      targetRegionId: regionId(localThreat),
      protectedBaseId: baseId(state),
      rallyNodeId: homeAccess ?? null,
      retreatNodeId: homeAccess ?? null,
      createdTick: existingLifecycle?.createdTick ?? observation.tick,
      assemblyDeadline:
        existingLifecycle?.assemblyDeadline ?? aiDeadline(observation.tick + AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS),
      effectDeadline: aiDeadline(observation.tick + AI_PURSUIT_LEASH_TICKS),
      lastUsefulEffectTick: existingLifecycle?.lastUsefulEffectTick ?? null,
      recoveryAttempt: existingLifecycle?.recoveryAttempt ?? 0,
      terminalReason: null
    }
  };
  context.nextSquads.push(defense);
  const actorClaims = defense.actorIds.map((actorId) => ({
    claimId: `claim:stage9:actor:${actorId}` as AiIntentV1["claims"][number]["claimId"],
    kind: "actor" as const,
    actorId
  }));
  if (!activeDefense?.tactics && targetPosition) {
    const attackableDefenders = defenders.filter((actor) => canSeeTarget(actor, localThreat, context.catalog));
    const interceptors = defenders.filter((actor) => !attackableDefenders.includes(actor));
    if (attackableDefenders.length > 0)
      context.intents.push({
        ...intentBase(state, defensePlanId, observation.tick, `defend:${localThreat.actorId}`, "army_threat", 940),
        kind: "attack",
        actorIds: attackableDefenders.map((actor) => actor.actorId),
        claims: actorClaims.filter((claim) => attackableDefenders.some((actor) => actor.actorId === claim.actorId)),
        targetActorId: localThreat.actorId,
        targetPosition: null
      });
    if (interceptors.length > 0)
      context.intents.push({
        ...intentBase(state, defensePlanId, observation.tick, `intercept:${localThreat.actorId}`, "army_threat", 900),
        kind: "move",
        actorIds: interceptors.map((actor) => actor.actorId),
        claims: actorClaims.filter((claim) => interceptors.some((actor) => actor.actorId === claim.actorId)),
        logicalPosition: targetPosition
      });
  }
  context.skirmish = withTimeline(
    context.skirmish,
    observation.tick,
    "mission",
    defense.squadId,
    `defend:${localThreat.actorId}`
  );
}
