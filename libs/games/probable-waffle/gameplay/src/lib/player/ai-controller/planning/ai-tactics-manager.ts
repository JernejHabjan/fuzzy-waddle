import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiBrainStateV1, AiSquadStateV1, AiSupportStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiProfileConfigV1 } from "../contracts/ai-profile-config-v1";
import type { AiManagerProposalV1, AiProposalManagerV1 } from "./ai-manager-proposal";
import { knownPosition, distance, movementDomains } from "./ai-tactics-geometry";
import { isEconomicActor } from "./ai-tactics-combat";
import { splitDomainSquads, boundedTacticalIntents } from "./ai-tactics-orders";
import { prepareAiTacticalSquad } from "./ai-tactics-mission-preparation";
import { decideAiTacticalSquad } from "./ai-tactics-mission-decision";
import { projectAiTacticalSquad } from "./ai-tactics-mission-projection";
import { proposeAiTacticalOrders } from "./ai-tactics-mission-orders";

import type { AiTacticsContext } from "./ai-tactics-context";
/** Owns deterministic local combat preservation, focus reservations, support windows and tactical recovery. */
export class AiTacticsManager implements AiProposalManagerV1 {
  readonly managerId = "stagez13.tactics";

  constructor(
    private readonly profile: AiProfileConfigV1,
    private readonly getCatalog?: () => AiCapabilityCatalogV1 | undefined
  ) {}

  propose(observation: AiObservationV1, state: AiBrainStateV1): AiManagerProposalV1 {
    const catalog = this.getCatalog?.();
    const actorById = new Map(observation.actors.map((actor) => [actor.actorId, actor]));
    const transportOwned = new Set(
      state.transport
        .filter((plan) => !["handoff", "completed", "cancelled", "failed"].includes(plan.phase))
        .flatMap((plan) => [...plan.passengerIds])
    );
    const visibleEnemies = observation.actors
      .filter((actor) => actor.relation === "enemy" && actor.visibility === "visible" && knownPosition(actor))
      .sort((left, right) => left.actorId.localeCompare(right.actorId));
    const assignedBeforeReinforcement = new Set(state.squads.flatMap((squad) => [...squad.actorIds]));
    const homeAnchors = state.bases
      .filter((base) => base.active && base.anchorPosition)
      .map((base) => base.anchorPosition!);
    const underLocalPressure = visibleEnemies.some(
      (enemy) =>
        enemy.housingCost.status === "known" &&
        enemy.housingCost.value > 0 &&
        homeAnchors.some((anchor) => distance(anchor, knownPosition(enemy)!) <= 12)
    );
    const reinforcementActors = observation.actors
      .filter(
        (actor) => actor.relation === "self" && actor.containedInActorId == null && !transportOwned.has(actor.actorId)
      )
      .filter((actor) => !isEconomicActor(actor, catalog))
      .filter((actor) => actor.combatProfile?.status === "known" && actor.combatProfile.value.attacks.length > 0)
      .filter((actor) => !assignedBeforeReinforcement.has(actor.actorId))
      .sort((left, right) => left.actorId.localeCompare(right.actorId));
    const augmentedSquads = state.squads.map((squad) => ({ ...squad, actorIds: [...squad.actorIds] }));
    for (const actor of reinforcementActors) {
      const destination =
        augmentedSquads.find((squad) => underLocalPressure && squad.role === "defense") ??
        augmentedSquads.find(
          (squad) =>
            squad.role === "attack" && (squad.domain === "mixed" || movementDomains(actor).includes(squad.domain))
        ) ??
        augmentedSquads.find((squad) => squad.role === "reinforcement" || squad.role === "reserve");
      if (destination) destination.actorIds = [...destination.actorIds, actor.actorId];
    }
    const claimedActors = new Set<ActorId>();
    const priority: Record<AiSquadStateV1["role"], number> = {
      defense: 0,
      escort: 1,
      attack: 2,
      reinforcement: 3,
      reserve: 4,
      scout: 5
    };
    const squads = splitDomainSquads(augmentedSquads, actorById).sort(
      (left, right) => priority[left.role] - priority[right.role] || left.squadId.localeCompare(right.squadId)
    );
    const updates: AiSquadStateV1[] = [];
    const intents: AiIntentV1[] = [];
    const terminalEffectIds = new Set(
      state.pendingOutcomes
        .filter(
          (outcome) =>
            outcome.kind === "completed" ||
            outcome.kind === "rejected" ||
            outcome.kind === "cancelled" ||
            outcome.kind === "failed"
        )
        .map((outcome) => outcome.identity.effectId)
    );
    const support: AiSupportStateV1[] = state.support
      .filter((plan) => plan.expiresAt === null || plan.expiresAt.dueTick > observation.tick)
      .filter((plan) => plan.effectId == null || !terminalEffectIds.has(plan.effectId as AiIntentV1["effectId"]))
      .slice(0, 32);
    const existingSupportIds = new Set(support.map((plan) => plan.planId));

    const context: AiTacticsContext = {
      profile: this.profile,
      observation,
      state,
      catalog,
      actorById,
      transportOwned,
      visibleEnemies,
      claimedActors,
      updates,
      intents,
      support
    };
    for (const squad of squads) {
      if (squad.state === "completed" || squad.state === "cancelled") continue;
      const prepared = prepareAiTacticalSquad(context, squad);
      if (!prepared) continue;
      const decision = decideAiTacticalSquad(prepared);
      const projection = projectAiTacticalSquad(decision);
      proposeAiTacticalOrders(projection);
    }

    const boundedIntents = boundedTacticalIntents(intents, this.profile.maxActorOrdersPerStep);
    const issuedEffectIds = new Set(boundedIntents.map((intent) => intent.effectId));
    const boundedSupport = support
      .filter(
        (plan) =>
          existingSupportIds.has(plan.planId) ||
          (plan.effectId != null && issuedEffectIds.has(plan.effectId as AiIntentV1["effectId"]))
      )
      .slice(-32);
    const issuedActorsByPlan = new Map<string, ActorId[]>();
    for (const intent of boundedIntents) {
      if (intent.kind !== "move" && intent.kind !== "attack") continue;
      issuedActorsByPlan.set(intent.planId, [...(issuedActorsByPlan.get(intent.planId) ?? []), ...intent.actorIds]);
    }
    const committedUpdates = updates.map((squad) =>
      squad.tactics
        ? {
            ...squad,
            tactics: {
              ...squad.tactics,
              orderedActorIds: [
                ...new Set([
                  ...squad.tactics.orderedActorIds,
                  ...(issuedActorsByPlan.get(`plan:${squad.squadId}`) ?? [])
                ])
              ]
                .filter((actorId) => squad.actorIds.includes(actorId))
                .sort()
            }
          }
        : squad
    );
    return {
      managerId: this.managerId,
      lane: "army_threat",
      evaluated: true,
      intents: boundedIntents,
      reasons: [
        `squads:${committedUpdates.length}`,
        `support:${boundedSupport.length}`,
        `orders:${boundedIntents.length}`
      ],
      statePatch: { squadUpdates: committedUpdates, support: boundedSupport }
    };
  }
}

export { estimateAiEngagementV1 } from "./ai-tactics-combat";
export {
  AI_TACTICS_ATTACK_RATIO_PERMILLE,
  AI_TACTICS_RETREAT_RATIO_PERMILLE,
  AI_TACTICS_TARGET_SWITCH_IMPROVEMENT_PERMILLE
} from "./ai-tactics-rules";
