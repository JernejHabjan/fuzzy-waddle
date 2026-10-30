import type { AiBrainStateV1, AiFortificationStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";

import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiProfileConfigV1 } from "../contracts/ai-profile-config-v1";

import { constructionEntry, resourceEntries } from "./ai-fortification-support";
import { isAvailableBuilder } from "./ai-macro-observation";
/** Proposes independent connected-prefix jobs; each available worker belongs to at most one new site. */
export function createFortificationIntents(
  profile: AiProfileConfigV1,
  plan: AiFortificationStateV1,
  observation: AiObservationV1,
  catalog: AiCapabilityCatalogV1,
  state: AiBrainStateV1
): AiIntentV1[] {
  if (!plan.graph || plan.lifecycle === "abandoned") return [];
  const graph = plan.graph;
  const finished = new Set(
    graph.nodes.filter((current) => current.lifecycle === "finished").map((current) => current.nodeId)
  );
  const cells = new Map(observation.map?.constructionCells?.map((cell) => [cell.tileKey, cell]));
  const candidates = graph.nodes
    .filter((current) => current.objectName !== null)
    .filter(
      (current) =>
        (current.lifecycle === "planned" || current.lifecycle === "destroyed") &&
        current.retryAfterTick <= observation.tick
    )
    .filter((current) => current.dependsOnNodeId === null || finished.has(current.dependsOnNodeId))
    // Dynamic obstructions may invalidate a previously legal layout; shared placement still owns final admission.
    .filter((current) =>
      current.footprintTileKeys.every((key) => {
        const cell = cells.get(key);
        return !cell || (cell.groundPassable && !cell.observedBlocked);
      })
    )
    .sort(
      (left, right) =>
        graph.constructionSequenceNodeIds.indexOf(left.nodeId) -
          graph.constructionSequenceNodeIds.indexOf(right.nodeId) || left.nodeId.localeCompare(right.nodeId)
    )
    .slice(0, Math.min(2, profile.maxAcceptedCommandBatchesPerStep));
  const claimed = new Set(
    state.reservations.flatMap((reservation) =>
      reservation.subjectKey?.startsWith("actor:") &&
      (reservation.state.kind !== "provisional" || reservation.state.expiresAt.dueTick > observation.tick)
        ? [reservation.subjectKey.slice("actor:".length)]
        : []
    )
  );
  const activeThreat = state.skirmish.incidents.some(
    (incident) =>
      (incident.baseId === null || incident.baseId === graph.baseId) &&
      incident.expiresAt.dueTick > observation.tick &&
      incident.severity >= 100
  );
  return candidates.flatMap((current, index): AiIntentV1[] => {
    const objectName = current.objectName;
    if (objectName === null) return [];
    const entry = constructionEntry(catalog, objectName);
    const builder = observation.actors
      .filter((actor) => actor.relation === "self" && actor.visibility === "owned")
      .filter((actor) => isAvailableBuilder(actor) && !claimed.has(actor.actorId))
      .sort((left, right) => left.actorId.localeCompare(right.actorId))
      .find((actor) =>
        catalog.entries.some(
          (candidate) => candidate.sourceObjectName === actor.objectName && candidate.constructs.includes(objectName)
        )
      );
    if (!builder) return [];
    claimed.add(builder.actorId);
    const effectId =
      `effect:fortification:${plan.planId}:${current.nodeId}:${current.attempt}` as AiIntentV1["effectId"];
    const intentId =
      `intent:fortification:${plan.planId}:${current.nodeId}:${current.attempt}` as AiIntentV1["intentId"];
    const resourceClaims = resourceEntries(entry?.constructionProfile?.resourceCost ?? {}).map(
      ([resourceType, amount], claimIndex) => ({
        claimId:
          `claim:fortification:${current.nodeId}:${current.attempt}:resource:${claimIndex}` as AiIntentV1["claims"][number]["claimId"],
        kind: "resource" as const,
        resourceType,
        amount
      })
    );
    return [
      {
        kind: "construct" as const,
        spendingCategory: "defense" as const,
        intentId,
        effectId,
        planId: `plan:${plan.planId}` as AiIntentV1["planId"],
        demandId: null,
        lane: "optional_infrastructure_tech" as const,
        proposedTick: observation.tick,
        urgencyClass: current.lifecycle === "destroyed" ? 1 : activeThreat ? 0 : 4,
        utility: activeThreat && current.lifecycle !== "destroyed"
          ? 985
          : Math.min(900, 500 + current.marginalCoverage * 10 + (current.lifecycle === "destroyed" ? 200 : 0)),
        preconditions: [
          { kind: "actor_exists" as const, actorId: builder.actorId },
          ...resourceClaims.map((claim) => ({
            kind: "resource_at_least" as const,
            resourceType: claim.resourceType,
            amount: claim.amount
          }))
        ],
        claims: [
          {
            claimId:
              `claim:fortification:${current.nodeId}:${current.attempt}:builder` as AiIntentV1["claims"][number]["claimId"],
            kind: "actor" as const,
            actorId: builder.actorId
          },
          {
            claimId:
              `claim:fortification:${current.nodeId}:${current.attempt}:site` as AiIntentV1["claims"][number]["claimId"],
            kind: "site" as const,
            siteKey: `fortification:${current.nodeId}`
          },
          {
            claimId:
              `claim:fortification:${current.nodeId}:${current.attempt}:effect` as AiIntentV1["claims"][number]["claimId"],
            kind: "effect" as const,
            effectId
          },
          ...resourceClaims
        ],
        reasonCode:
          current.lifecycle === "destroyed"
            ? `fortification:breach_rebuild:${current.nodeId}`
            : `fortification:connected_prefix:${current.componentId}:${index}`,
        builderIds: [builder.actorId],
        objectName,
        logicalPosition: current.position,
        siteKey: `fortification:${current.nodeId}`
      }
    ];
  });
}

/** Moves surviving ground defenders behind the retained opening while the breached component recovers. */
export function createFortificationBreachResponse(
  profile: AiProfileConfigV1,
  plan: AiFortificationStateV1,
  observation: AiObservationV1,
  state: AiBrainStateV1
): AiIntentV1[] {
  if (plan.lifecycle !== "breached" || !plan.graph || plan.graph.breach.responseEffectId) return [];
  const missingComponents = new Set(
    plan.graph.nodes
      .filter((node) => plan.graph?.breach.missingNodeIds.includes(node.nodeId))
      .map((node) => node.componentId)
  );
  const assignedDisconnectedDefenders = plan.graph.defenderPosts
    .filter((post) => {
      const node = plan.graph?.nodes.find((candidate) => candidate.nodeId === post.nodeId);
      return node !== undefined && missingComponents.has(node.componentId);
    })
    .flatMap((post) => post.assignedActorIds);
  const squad = state.squads
    .filter((candidate) => candidate.domain === "ground" || candidate.domain === "mixed")
    .filter((candidate) => candidate.state !== "completed" && candidate.state !== "cancelled")
    .sort(
      (left, right) =>
        (left.role === "defense" ? -1 : 0) - (right.role === "defense" ? -1 : 0) ||
        left.squadId.localeCompare(right.squadId)
    )[0];
  const actorIds = [...new Set([...assignedDisconnectedDefenders, ...(squad?.actorIds ?? [])])]
    .filter((actorId) => observation.actors.some((actor) => actor.actorId === actorId && actor.relation === "self"))
    .slice(0, profile.maxActorOrdersPerStep);
  const graph = plan.graph;
  const opening = graph.nodes.find((candidate) => candidate.nodeId === graph.openingNodeId);
  const base = state.bases.find((candidate) => candidate.baseId === graph.baseId);
  if (!actorIds.length || !opening || !base?.anchorPosition) return [];
  const dx = Math.sign(base.anchorPosition.x - opening.position.x);
  const dy = Math.sign(base.anchorPosition.y - opening.position.y);
  const logicalPosition = { ...opening.position, x: opening.position.x + dx, y: opening.position.y + dy };
  const effectId =
    `effect:fortification:${plan.planId}:breach:${plan.graph.breach.recoveryAttempts}` as AiIntentV1["effectId"];
  return [
    {
      kind: "move",
      intentId:
        `intent:fortification:${plan.planId}:breach:${plan.graph.breach.recoveryAttempts}` as AiIntentV1["intentId"],
      effectId,
      planId: `plan:${plan.planId}` as AiIntentV1["planId"],
      demandId: null,
      lane: "army_threat",
      proposedTick: observation.tick,
      urgencyClass: 0,
      utility: 900,
      preconditions: actorIds.map((actorId) => ({ kind: "actor_exists" as const, actorId })),
      claims: [
        ...actorIds.map((actorId, index) => ({
          claimId: `claim:fortification:${plan.planId}:defender:${index}` as AiIntentV1["claims"][number]["claimId"],
          kind: "actor" as const,
          actorId
        })),
        {
          claimId: `claim:fortification:${plan.planId}:breach-effect` as AiIntentV1["claims"][number]["claimId"],
          kind: "effect",
          effectId
        }
      ],
      reasonCode: `fortification:breach_defenders:${plan.graph.breach.reason}`,
      actorIds,
      logicalPosition
    }
  ];
}
