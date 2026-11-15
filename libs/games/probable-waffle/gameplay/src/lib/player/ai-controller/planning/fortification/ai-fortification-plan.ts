import type { ActorId, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainState, AiFortificationState } from "../../contracts/state/ai-state-contracts";
import type { AiCapabilityCatalog } from "../../contracts/observation/ai-capability-catalog";

import type { AiObservation } from "../../contracts/observation/ai-observation";
import type { AiProfileConfig } from "../../contracts/ai-profile-config";

import {
  isDefensiveArchetype,
  threatPosition,
  constructionEntry,
  resourceEntries,
  positionOf,
  AI_TURTLE_FORTIFICATION_SPEND_PERMILLE,
  AI_STANDARD_FORTIFICATION_SPEND_PERMILLE
} from "./ai-fortification-support";
import { createFortificationLayout, type FortificationLayoutRejection } from "./ai-fortification-layout";

/** Creates one justified layout and prices its actual definition-backed nodes against protected macro funds. */
export type FortificationPlanCreation =
  | { plan: AiFortificationState; reason: "plan_created" }
  | {
      plan: null;
      reason:
        | "defense_trigger_not_justified"
        | "fortification_target_unknown"
        | "fortification_capability_unavailable"
        | "fortification_builder_coverage_unmet"
        | "fortification_height_incompatible"
        | "fortification_first_stage_missing"
        | "first_stage_over_protected_macro_budget"
        | FortificationLayoutRejection;
    };

export function createFortificationPlan(
  profile: AiProfileConfig,
  gateObjectName: ObjectNames | null,
  observation: AiObservation,
  state: AiBrainState,
  baseId: AiFortificationState["protectedBaseIds"][number],
  anchor: Vector3Simple,
  catalog: AiCapabilityCatalog
): AiFortificationState | null {
  return createFortificationPlanWithReason(profile, gateObjectName, observation, state, baseId, anchor, catalog).plan;
}

export function createFortificationPlanWithReason(
  profile: AiProfileConfig,
  gateObjectName: ObjectNames | null,
  observation: AiObservation,
  state: AiBrainState,
  baseId: AiFortificationState["protectedBaseIds"][number],
  anchor: Vector3Simple,
  catalog: AiCapabilityCatalog
): FortificationPlanCreation {
  const incident = state.skirmish.incidents
    .filter((candidate) => candidate.baseId === null || candidate.baseId === baseId)
    .sort((left, right) => right.severity - left.severity || left.incidentId.localeCompare(right.incidentId))[0];
  const defensiveProfile = isDefensiveArchetype(state.opening.archetypeId);
  if ((!incident || incident.severity < 100) && !defensiveProfile)
    return { plan: null, reason: "defense_trigger_not_justified" };
  const enemy = threatPosition(observation, anchor);
  const target =
    enemy ??
    (observation.map?.bounds.status === "known"
      ? { x: observation.map.bounds.value.width / 2, y: observation.map.bounds.value.height / 2, z: 0 }
      : null);
  if (!target) return { plan: null, reason: "fortification_target_unknown" };

  const wallEntry = constructionEntry(catalog, ObjectNames.Wall);
  const towerEntry = constructionEntry(catalog, ObjectNames.WatchTower);
  const stairEntry = constructionEntry(catalog, ObjectNames.Stairs);
  const builders = observation.actors
    .filter((actor) => actor.relation === "self" && actor.visibility === "owned")
    .filter((actor) =>
      catalog.entries.some(
        (entry) =>
          entry.sourceObjectName === actor.objectName &&
          [ObjectNames.Wall, ObjectNames.WatchTower, ObjectNames.Stairs].every((objectName) =>
            entry.constructs.includes(objectName)
          )
      )
    );
  if (!wallEntry?.constructionProfile || !towerEntry?.constructionProfile || !stairEntry?.constructionProfile)
    return { plan: null, reason: "fortification_capability_unavailable" };
  if (builders.length < 2) return { plan: null, reason: "fortification_builder_coverage_unmet" };
  if (
    stairEntry.constructionProfile.enterHeight !== 0 ||
    stairEntry.constructionProfile.exitHeight === null ||
    stairEntry.constructionProfile.exitHeight !== wallEntry.constructionProfile.enterHeight ||
    stairEntry.constructionProfile.exitHeight !== towerEntry.constructionProfile.enterHeight
  )
    return { plan: null, reason: "fortification_height_incompatible" };

  const planId = `fortification:${baseId}` as AiFortificationState["planId"];
  const layoutResult = createFortificationLayout(
    observation,
    anchor,
    target,
    planId,
    wallEntry,
    towerEntry,
    stairEntry,
    gateObjectName,
    catalog,
    profile
  );
  if (!layoutResult.layout) return { plan: null, reason: layoutResult.reason };
  const layout = layoutResult.layout;
  const { routedNodes, gate, terrainAnchorTileKeys } = layout;
  const entries = new Map([
    [ObjectNames.Wall, wallEntry],
    [ObjectNames.WatchTower, towerEntry],
    [ObjectNames.Stairs, stairEntry]
  ]);
  const committedByResource: Partial<Record<ResourceType, number>> = {};
  const priorCommittedByResource: Partial<Record<ResourceType, number>> = {};
  for (const existing of state.fortifications.filter(
    (candidate) => candidate.graph?.baseId !== baseId && candidate.lifecycle !== "abandoned"
  )) {
    for (const [resourceType, amount] of resourceEntries(existing.graph?.budget.committedByResource ?? {})) {
      priorCommittedByResource[resourceType] = (priorCommittedByResource[resourceType] ?? 0) + amount;
    }
  }
  const spendPermille = defensiveProfile
    ? AI_TURTLE_FORTIFICATION_SPEND_PERMILLE
    : AI_STANDARD_FORTIFICATION_SPEND_PERMILLE;
  const constructionSequenceNodeIds = [
    ...routedNodes.filter((candidate) => candidate.kind !== "gate_slot").map((candidate) => candidate.nodeId),
    ...routedNodes
      .filter((candidate) => candidate.kind === "gate_slot" && candidate.objectName !== null)
      .map((candidate) => candidate.nodeId)
  ];
  const firstBuildable = constructionSequenceNodeIds
    .map((id) => routedNodes.find((candidate) => candidate.nodeId === id))
    .find((candidate) => candidate?.objectName !== null);
  if (!firstBuildable?.objectName) return { plan: null, reason: "fortification_first_stage_missing" };
  const firstBuildableCost = entries.get(firstBuildable.objectName)?.constructionProfile?.resourceCost ?? {};
  const remainingByResource: Partial<Record<ResourceType, number>> = {};
  for (const [resourceType, amount] of resourceEntries(firstBuildableCost)) {
    const ledger = observation.resources.find((entry) => entry.resourceType === resourceType);
    const spendable = Math.max(
      0,
      (ledger?.stockpile ?? 0) - (ledger?.reservedUnspent ?? 0) - (ledger?.obligationsDue ?? 0)
    );
    const ceiling = Math.floor(((spendable + (priorCommittedByResource[resourceType] ?? 0)) * spendPermille) / 1000);
    const prior = priorCommittedByResource[resourceType] ?? 0;
    if (prior + amount > ceiling) return { plan: null, reason: "first_stage_over_protected_macro_budget" };
  }
  for (const ledger of observation.resources) {
    const spendable = Math.max(0, ledger.stockpile - ledger.reservedUnspent - ledger.obligationsDue);
    const prior = priorCommittedByResource[ledger.resourceType] ?? 0;
    const ceiling = Math.floor(((spendable + prior) * spendPermille) / 1000);
    remainingByResource[ledger.resourceType] = Math.max(0, ceiling - prior);
  }
  const protectedAssetIds = observation.actors
    .filter((actor) => actor.relation === "self")
    .map((actor) => ({ actorId: actor.actorId, position: positionOf(actor) }))
    .filter((actor): actor is { actorId: ActorId; position: Vector3Simple } => actor.position !== null)
    .filter((actor) => Math.abs(actor.position.x - anchor.x) + Math.abs(actor.position.y - anchor.y) <= 12)
    .map((actor) => actor.actorId)
    .sort();
  const eligibleDefenderIds = [
    ...new Set(
      state.squads
        .filter((squad) => squad.role === "defense" || squad.role === "reserve")
        .filter((squad) => squad.domain === "ground" || squad.domain === "mixed")
        .flatMap((squad) => squad.actorIds)
        .filter((actorId) => observation.actors.some((actor) => actor.actorId === actorId && actor.relation === "self"))
    )
  ].sort();
  return {
    reason: "plan_created",
    plan: {
      planId,
      nodeIds: routedNodes.map((candidate) => candidate.nodeId),
      completedNodeIds: gate.objectName === null ? [gate.nodeId] : [],
      protectedBaseIds: [baseId],
      lifecycle: "planned",
      graph: {
        baseId,
        createdTick: observation.tick,
        terrainAnchorTileKeys,
        openingNodeId: gate.nodeId,
        protectedAssetIds,
        wholeConnectivity: "preserved",
        incrementalConnectivity: "preserved",
        budget: { spendPermille, committedByResource, remainingByResource },
        nodes: routedNodes,
        constructionSequenceNodeIds,
        defenderPosts: routedNodes
          .filter((candidate) => candidate.kind === "tower")
          .map((candidate, index) => {
            const defenderId = eligibleDefenderIds[index];
            return { nodeId: candidate.nodeId, assignedActorIds: defenderId ? [defenderId] : [], reachable: false };
          }),
        breach: { missingNodeIds: [], reason: null, risk: "none", responseEffectId: null, recoveryAttempts: 0 }
      }
    }
  };
}
