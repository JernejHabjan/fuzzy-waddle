import type { ActorId, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type {
  AiBrainStateV1,
  AiFortificationNodeStateV1,
  AiFortificationStateV1
} from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogEntryV1, AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";

import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiProfileConfigV1 } from "../contracts/ai-profile-config-v1";

import {
  isDefensiveArchetype,
  threatPosition,
  constructionEntry,
  resourceEntries,
  positionOf,
  AI_TURTLE_FORTIFICATION_SPEND_PERMILLE,
  AI_STANDARD_FORTIFICATION_SPEND_PERMILLE
} from "./ai-fortification-support";
import { createFortificationLayout } from "./ai-fortification-layout";
function sumCost(
  nodes: readonly AiFortificationNodeStateV1[],
  entries: ReadonlyMap<string, AiCapabilityCatalogEntryV1>
): Partial<Record<ResourceType, number>> {
  const result: Partial<Record<ResourceType, number>> = {};
  for (const current of nodes) {
    if (!current.objectName) continue;
    const cost = entries.get(current.objectName)?.constructionProfile?.resourceCost ?? {};
    for (const [resourceType, amount] of resourceEntries(cost))
      result[resourceType] = (result[resourceType] ?? 0) + amount;
  }
  return result;
}

/** Creates one justified layout and prices its actual definition-backed nodes against protected macro funds. */
export function createFortificationPlan(
  profile: AiProfileConfigV1,
  gateObjectName: ObjectNames | null,
  observation: AiObservationV1,
  state: AiBrainStateV1,
  baseId: AiFortificationStateV1["protectedBaseIds"][number],
  anchor: Vector3Simple,
  catalog: AiCapabilityCatalogV1
): AiFortificationStateV1 | null {
  const incident = state.skirmish.incidents
    .filter((candidate) => candidate.baseId === null || candidate.baseId === baseId)
    .sort((left, right) => right.severity - left.severity || left.incidentId.localeCompare(right.incidentId))[0];
  const defensiveProfile = isDefensiveArchetype(state.opening.archetypeId);
  if ((!incident || incident.severity < 100) && !defensiveProfile) return null;
  const enemy = threatPosition(observation, anchor);
  const target =
    enemy ??
    (observation.map?.bounds.status === "known"
      ? { x: observation.map.bounds.value.width / 2, y: observation.map.bounds.value.height / 2, z: 0 }
      : null);
  if (!target) return null;

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
  if (
    !wallEntry?.constructionProfile ||
    !towerEntry?.constructionProfile ||
    !stairEntry?.constructionProfile ||
    builders.length < 2
  )
    return null;
  if (
    stairEntry.constructionProfile.enterHeight !== 0 ||
    stairEntry.constructionProfile.exitHeight === null ||
    stairEntry.constructionProfile.exitHeight !== wallEntry.constructionProfile.enterHeight ||
    stairEntry.constructionProfile.exitHeight !== towerEntry.constructionProfile.enterHeight
  )
    return null;

  const planId = `fortification:${baseId}` as AiFortificationStateV1["planId"];
  const layout = createFortificationLayout(
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
  if (!layout) return null;
  const { routedNodes, gate, terrainAnchorTileKeys } = layout;
  const entries = new Map([
    [ObjectNames.Wall, wallEntry],
    [ObjectNames.WatchTower, towerEntry],
    [ObjectNames.Stairs, stairEntry]
  ]);
  const committedByResource = sumCost(routedNodes, entries);
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
  const remainingByResource: Partial<Record<ResourceType, number>> = {};
  for (const [resourceType, amount] of resourceEntries(committedByResource)) {
    const ledger = observation.resources.find((entry) => entry.resourceType === resourceType);
    const available = Math.max(
      0,
      (ledger?.stockpile ?? 0) - (ledger?.reservedUnspent ?? 0) - (ledger?.obligationsDue ?? 0)
    );
    const ceiling = Math.floor((available * spendPermille) / 1000);
    const prior = priorCommittedByResource[resourceType] ?? 0;
    if (prior + amount > ceiling) return null;
    remainingByResource[resourceType] = ceiling - prior - amount;
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
      constructionSequenceNodeIds: [
        ...routedNodes.filter((candidate) => candidate.kind !== "gate_slot").map((candidate) => candidate.nodeId),
        ...routedNodes
          .filter((candidate) => candidate.kind === "gate_slot" && candidate.objectName !== null)
          .map((candidate) => candidate.nodeId)
      ],
      defenderPosts: routedNodes
        .filter((candidate) => candidate.kind === "tower")
        .map((candidate, index) => {
          const defenderId = eligibleDefenderIds[index];
          return { nodeId: candidate.nodeId, assignedActorIds: defenderId ? [defenderId] : [], reachable: false };
        }),
      breach: { missingNodeIds: [], reason: null, risk: "none", responseEffectId: null, recoveryAttempts: 0 }
    }
  };
}
