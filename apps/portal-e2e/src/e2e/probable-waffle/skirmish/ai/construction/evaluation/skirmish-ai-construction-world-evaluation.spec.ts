import { expect, test } from "@playwright/test";
import { ObjectNames, ProbableWaffleGameCommandTypes } from "@fuzzy-waddle/probable-waffle-protocol";
import { evaluateConstructionRecoveryWorld } from "./skirmish-ai-construction-world-evaluation";

/** Complete setup metadata alone intentionally supplies no native work/payment/completion evidence. */
function metadataOnlyWorld(): Parameters<typeof evaluateConstructionRecoveryWorld>[1] {
  const execution = {
    schemaVersion: 1 as const, commandId: "construct", commitmentKey: "site", source: "human" as const,
    authorityEpoch: 1, sequence: 1
  };
  const cash = { food: 100, wood: 100, stone: 100, minerals: 100 };
  return {
    presetCreatedActorIds: { "unfinished-producer": "site", "original-builder": "builder" },
    checkpoints: [], perturbations: [],
    productionPreset: {
      fixtureId: "world", sourceRevision: "a".repeat(40), fixtureDigest: "fnv1a32:12345678",
      createdActorNames: [], createdActorIds: { "unfinished-producer": "site", "original-builder": "builder" },
      resourceGrantCount: 0, resourceStartCount: 0, queuedItemCount: 0,
      initialQueueItems: [], queueApplications: [], initialOrderCount: 0, eventResults: [],
      constructionApplications: [{
        fixtureActorId: "unfinished-producer", siteActorId: "site",
        command: {
          type: ProbableWaffleGameCommandTypes.Construct, actorName: ObjectNames.AnkGuard,
          playerNumber: 2, actorIds: ["builder"], tileVec3: { x: 10, y: 10, z: 0 },
          siteKey: "site", tick: 0, execution
        },
        outcomes: [{
          ...execution, kind: "applied", reason: "applied", tick: 0,
          playerNumber: 2, actorIds: ["builder"], worldLinkIds: ["site"]
        }],
        resourcesBefore: cash, resourcesAfter: cash
      }]
    },
    productionCapture: {
      schemaVersion: 1, kind: "production_authority_capture", startedTick: 0, playerNumber: 2,
      droppedFactCount: 0, droppedSnapshotCount: 0, gaps: [], facts: [], snapshots: [],
      frontiers: { latestTick: 1200, closedThroughTick: 1200, requiredTicks: [1200], intervals: [], gaps: [] }
    }
  };
}

test.describe("native construction binding fail-closed controls", () => {
  test("does not substitute fixture presence or an applied receipt for actual native history", () => {
    expect(evaluateConstructionRecoveryWorld("intact", {
      presetCreatedActorIds: {}, checkpoints: [], perturbations: []
    })).toEqual(["construction_setup_application_missing"]);
    const metadata = metadataOnlyWorld();
    expect(evaluateConstructionRecoveryWorld("intact", { ...metadata, productionCapture: undefined }))
      .toEqual(["construction_native_history_incomplete"]);
    expect(evaluateConstructionRecoveryWorld("intact", metadata))
      .toEqual(["construction_closed_interval_missing_or_reordered"]);
  });

  test("rejects unfinished coverage, missing clocks and dropped native facts", () => {
    const metadata = metadataOnlyWorld();
    const capture = metadata.productionCapture;
    if (!capture || !capture.frontiers) throw new Error("missing authored capture");
    for (const changed of [
      { ...capture, droppedFactCount: 1 },
      { ...capture, startedTick: 1 },
      { ...capture, frontiers: { ...capture.frontiers, closedThroughTick: 1199 } },
      { ...capture, frontiers: { ...capture.frontiers, gaps: ["observer_failed"] } }
    ]) {
      expect(evaluateConstructionRecoveryWorld("intact", { ...metadata, productionCapture: changed }))
        .toEqual(["construction_native_history_incomplete"]);
    }
  });

  test("closed tick counters cannot create missing payment, work or completion callbacks", () => {
    const metadata = metadataOnlyWorld();
    const capture = metadata.productionCapture;
    if (!capture || !capture.frontiers) throw new Error("missing authored capture");
    const result = evaluateConstructionRecoveryWorld("intact", { ...metadata, productionCapture: {
      ...capture, frontiers: { ...capture.frontiers, intervals: [{
        capturedAtTick: 1201, closedFromTick: 0, closedThroughTick: 1200, afterSequence: 0,
        actors: [], queues: [], completedResearch: []
      }] }
    } });
    expect(result).toContain("original_site_did_not_start_before_interruption");
    expect(result).toContain("original_construction_not_paid_exactly_once");
    expect(result).toContain("same_site_completion_missing_or_duplicated");
  });
});
