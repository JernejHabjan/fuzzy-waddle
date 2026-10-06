import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { AiRuntimeProductionSpatialV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-spatial-v1";
import { productionCompletionFixture } from "./skirmish-ai-runtime-production-completion-fixture";

/** Invented native creation/branch/query order only. No live movement, cache freshness or useful strategic arrival. */
export function producerRouteFixture() {
  const base = productionCompletionFixture();
  const after = base.facts.find((fact) => fact.kind === "queue_completion" && fact.completion.phase === "after");
  if (!after || after.kind !== "queue_completion" ||
    !after.completion.createdActor || !after.completion.item) throw new Error("synthetic_route_authority_missing");
  const product = after.completion.createdActor;
  const producer = { ...product, actorId: "producer", objectName: ObjectNames.TivaraSandhold,
    canonicalObjectName: ObjectNames.TivaraSandhold };
  const boundary = { clockTick: 10, sceneActive: true, snapshotRestoreInProgress: false, gaps: [] };
  const fact = (spatial: AiRuntimeProductionSpatialV1): AiRuntimeProductionFactV1 => ({
    sequence: 0, tick: spatial.clockTick ?? 10, playerNumber: 1, kind: "spatial_authority", spatial });
  const spawn = { ...boundary, kind: "spawn", producer, item: after.completion.item, waterUnit: false,
    tile: { x: 3, y: 4 }, position: { x: 100, y: 200, z: 0 } } satisfies AiRuntimeProductionSpatialV1;
  const output = { ...boundary, kind: "output", outputId: 1, producer, product, item: after.completion.item,
    rallyMode: "tile_action", target: null, targetTile: { x: 8, y: 9, z: 0 } } satisfies AiRuntimeProductionSpatialV1;
  const requested = { ...boundary, kind: "producer_path", queryId: 1, purpose: "product_output", outputId: 1,
    method: "tile_static", phase: "requested", source: product, target: null,
    sourceInCaptureScene: true, targetInCaptureScene: null,
    sourceTile: { x: 3, y: 4 }, targetTile: { x: 8, y: 9 }, radiusTiles: null, dynamicBlockerCount: null,
    navigation: { graphObservationId: 1, updateRequestCount: 0 }, path: null, result: null
  } satisfies AiRuntimeProductionSpatialV1;
  const resolved = { ...requested, phase: "resolved", path: [], result: "path" } satisfies AiRuntimeProductionSpatialV1;
  const facts = base.facts.flatMap((entry): AiRuntimeProductionFactV1[] => {
    if (entry.kind === "queue_completion" && entry.completion.phase === "before") return [fact(spawn), entry];
    if (entry.kind === "outcome" && entry.outcome.kind === "completed") return [fact(output), entry];
    return [entry];
  });
  facts.push(fact(requested), fact(resolved));
  return { capture: { ...base, facts: facts.map((entry, index) => ({ ...entry, sequence: index + 1 })) },
    producer, product, spawn, output, requested, resolved, fact };
}
