import { FactionType, ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiObservationV1, AiObservedActorV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimePresetApplicationV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-application-v1";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { productionQueueMutationFixture } from "./skirmish-ai-runtime-production-queue-mutation-fixture";

/** Synthetic price/readiness/setup joins only; never a legal runtime world, stable useful force or navigation proof. */
export function productionWorldFixture(payment: "immediate" | "tick" = "immediate") {
  const source = productionQueueMutationFixture(payment);
  const facts = source.facts.filter((fact) => fact.kind === "command_delivered" || fact.kind === "queue_mutation" ||
    fact.kind === "outcome" || (payment === "immediate" && fact.kind === "queue_resource"))
    .map((fact): AiRuntimeProductionFactV1 => {
      if (fact.kind === "command_delivered") return { ...fact, tick: 0, command: { ...fact.command, tick: 0 } };
      if (fact.kind === "outcome") return { ...fact, tick: 0, outcome: { ...fact.outcome, tick: 0,
        reason: fact.outcome.kind === "applied" ? "applied" : fact.outcome.reason,
        worldLinkIds: fact.outcome.kind === "applied"
          ? [`queue:${fact.outcome.actorIds[0]}:${fact.outcome.commandId}`] : fact.outcome.worldLinkIds } };
      return { ...fact, tick: 0 };
    });
  const insertion = facts.find((fact) => fact.kind === "queue_mutation" && fact.mutation.phase === "after");
  const delivered = facts.find((fact) => fact.kind === "command_delivered");
  if (!insertion || insertion.kind !== "queue_mutation" || !insertion.boundaryState?.queues ||
    !delivered || delivered.kind !== "command_delivered" || delivered.command.type !== "PRODUCTION" || !insertion.mutation.item) {
    throw new Error("synthetic_initial_queue_missing");
  }
  const item = insertion.mutation.item;
  const actor = { actorId: "producer", objectName: "producer", canonicalObjectName: ObjectNames.AnkGuard,
    playerNumber: 1, indexed: true, active: true, alive: true, finished: true, currentLevel: 1 };
  const catalog = [{ producerActorId: "producer", productKey: delivered.command.actorName, kind: "production" as const,
    objectName: delivered.command.actorName, researchType: null, priceSource: "base_production_definition" as const,
    effectiveLevel: 2, cost: { ...item.charge },
    payment: item.payment === "immediate" ? "immediate" as const : "per_successful_tick" as const,
    durationMs: item.totalTimeMs, durationTicks: 3 }];
  const balance = { food: 100, wood: 100, stone: 100, minerals: 100 };
  const noObservation = (): AiObservationV1 | null => null;
  const capture = { ...source, facts, snapshots: [{ tick: 0, observation: noObservation(), capabilityCatalog: null,
    ownedActors: [{ actorId: "producer", objectName: "producer" }], economyProduction: null, reservations: [],
    // Deliberate setup reset: actual payment provenance must use its own before/after balances.
    resources: { ...balance, food: 25 }, pendingCommands: [], pendingResourceClaims: null,
    obligations: insertion.boundaryState.obligations ?? balance,
    queues: insertion.boundaryState.queues.map((queue) => ({ ...queue })),
    completedResearch: [], world: { snapshotRestoreInProgress: false, actors: [actor], catalog, gaps: [] } }] }
    satisfies AiRuntimeProductionCaptureV1;
  const setup = { fixtureId: "synthetic-setup", sourceRevision: "synthetic-source", fixtureDigest: "synthetic-digest",
    createdActorNames: ["producer"], createdActorIds: { producer: "producer" }, resourceGrantCount: 1, resourceStartCount: 1,
    queuedItemCount: 1, initialOrderCount: 0, eventResults: [], initialQueueItems: [{ producerFixtureActorId: "producer",
      producerActorId: "producer", itemId: item.itemId, kind: "production", objectName: item.objectName, researchType: null }],
    queueApplications: [{ producerFixtureActorId: "producer", itemId: item.itemId, command: delivered.command,
      outcomes: facts.flatMap((fact) => fact.kind === "outcome" && fact.outcome.commandId === item.commandId ? [fact.outcome] : []),
      resourcesBefore: balance, resourcesAfter: { ...balance, food: payment === "immediate" ? 93 : 100 } }] }
    satisfies AiRuntimePresetApplicationV1;
  return { capture, setup };
}

/** A complete typed fair observation with only the producer exposed; no live or hidden actors are consulted. */
export function productionWorldObservation(tick = 0): AiObservationV1 {
  const known = <T>(value: T) => ({ status: "known" as const, value, observedTick: tick });
  const unknown = { status: "unknown", reason: "not_supported" } as const;
  const actor = { actorId: "producer", objectName: ObjectNames.AnkGuard, owner: 1, relation: "self", visibility: "owned",
    observedTick: tick, evidenceId: "evidence:contact:producer", logicalPosition: known({ x: 7, y: 9, z: 0 }),
    accessNodeId: unknown, effectiveLevel: known(1), capabilities: [], queue: unknown, cost: unknown,
    housingCost: unknown, housingCapacity: unknown, resourceState: unknown, activeEffectIds: [] } satisfies AiObservedActorV1;
  return { schemaVersion: 1, generation: 1, tick, playerNumber: 1, faction: FactionType.Tivara, actors: [actor], resources: [],
    accessProducts: [], effects: [], modeGoals: [], researchCandidates: [], threatSummary: { observedTick: tick,
      visibleEnemyActorIds: [], rememberedEnemyActorIds: [], observedCapabilityFamilies: [] } };
}
