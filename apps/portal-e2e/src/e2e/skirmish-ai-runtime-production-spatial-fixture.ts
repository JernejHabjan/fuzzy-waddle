import { ObjectNames, type ConstructCommand } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionSpatialV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-spatial-v1";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { productionWorldFixture } from "./skirmish-ai-runtime-production-world-fixture";

/** Synthetic native callback intervals, not an applied construction or fair safe-site proof. */
export function productionSpatialFixture() {
  const base = productionWorldFixture().capture;
  const source = { actorId: "builder", objectName: ObjectNames.TivaraWorker, canonicalObjectName: ObjectNames.TivaraWorker,
    playerNumber: 1, indexed: true, active: true, alive: true, finished: true };
  const target = { ...source, actorId: "site", objectName: ObjectNames.TivaraSandhold,
    canonicalObjectName: ObjectNames.TivaraSandhold, finished: false };
  const command = { type: "CONSTRUCT", playerNumber: 1, actorIds: ["builder"], actorName: ObjectNames.TivaraSandhold,
    tick: 20, tileVec3: { x: 7, y: 9, z: 0 }, siteKey: "site:key", execution: { schemaVersion: 1, source: "ai",
      commandId: "construction", commitmentKey: "construction", sequence: 1, authorityEpoch: 0 } } satisfies ConstructCommand;
  const boundary = { clockTick: 20, snapshotRestoreInProgress: false, sceneActive: true, gaps: [] };
  const placement = { ...boundary, kind: "placement", command, site: target,
    footprint: [{ x: 7, y: 9 }], legal: true } satisfies AiRuntimeProductionSpatialV1;
  const requested = { ...boundary, kind: "builder_path", queryId: 1, phase: "requested", source, target,
    sourceTile: { x: 5, y: 9 }, targetTile: { x: 7, y: 9 }, radiusTiles: 1, path: null, result: null }
    satisfies AiRuntimeProductionSpatialV1;
  const resolved = { ...requested, phase: "resolved", path: [{ x: 5, y: 9 }, { x: 6, y: 9 }], result: "path" }
    satisfies AiRuntimeProductionSpatialV1;
  const spawn = { ...boundary, kind: "spawn", producer: { ...target, finished: true },
    item: { itemId: "queue:site:purchase", identitySource: "command", commandId: "purchase", effectId: "purchase",
      objectName: ObjectNames.TivaraWorker, researchType: null, totalTimeMs: 150, remainingTimeMs: 0,
      payment: "immediate", charge: { food: 7 } }, waterUnit: false, tile: { x: 6, y: 9 }, position: { x: 100, y: 200, z: 0 } }
    satisfies AiRuntimeProductionSpatialV1;
  const fact = (spatial: AiRuntimeProductionSpatialV1, sequence: number): AiRuntimeProductionFactV1 =>
    ({ kind: "spatial_authority", playerNumber: 1, tick: spatial.clockTick ?? 20, sequence, spatial });
  const capture = { ...base, snapshots: [], facts: [fact(placement, 1), fact(requested, 2), fact(resolved, 3), fact(spawn, 4)] };
  return { capture, fact, placement, requested, resolved, spawn };
}
