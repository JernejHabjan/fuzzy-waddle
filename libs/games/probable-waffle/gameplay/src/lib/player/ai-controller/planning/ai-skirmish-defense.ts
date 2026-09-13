import { aiDeadline, type AiPlanId, type AiSquadId } from "../contracts/ai-core-types";
import type { AiSquadStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiSkirmishProposalContext } from "./ai-skirmish-proposal-context";
import { baseId, canTarget, domains, intentBase, position, regionId, withTimeline } from "./ai-skirmish-support";

export const AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS = 1200;
export const AI_PURSUIT_LEASH_TICKS = 200;

export function advanceAiSkirmishDefense(context: AiSkirmishProposalContext): void {
  const { localThreat, combat, activeDefense, state, observation, homeAccess } = context;
  if (!localThreat || combat.length === 0) return;
  const defenders = combat.slice(0, Math.max(1, Math.ceil(combat.length * 0.25)));
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
  if (!activeDefense?.tactics && targetPosition && canTarget(defenders[0] ?? combat[0]!, localThreat))
    context.intents.push({
      ...intentBase(state, defensePlanId, observation.tick, `defend:${localThreat.actorId}`, "army_threat", 940),
      kind: "attack",
      actorIds: defense.actorIds,
      targetActorId: localThreat.actorId,
      targetPosition: null
    });
  else if (!activeDefense?.tactics && targetPosition)
    context.intents.push({
      ...intentBase(state, defensePlanId, observation.tick, `intercept:${localThreat.actorId}`, "army_threat", 900),
      kind: "move",
      actorIds: defense.actorIds,
      logicalPosition: targetPosition
    });
  context.skirmish = withTimeline(
    context.skirmish,
    observation.tick,
    "mission",
    defense.squadId,
    `defend:${localThreat.actorId}`
  );
}
