import { expect, test } from "@playwright/test";
import { ObjectNames, ProbableWaffleGameCommandTypes } from "@fuzzy-waddle/probable-waffle-protocol";
import { evaluateRuntimePlacementPrefixes } from "./skirmish-ai-placement-prefix-evaluation";
import type { RuntimePresetWorldV1 } from "./skirmish-ai-runtime-preset-world";
import type { AiRuntimePlacementClearanceV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-placement-clearance-v1";

const route = { id: "army-retreat", playerNumber: 2, from: { x: 32, y: 16 }, to: { x: 96, y: 48 }, tileMargin: 1 };
const preset: RuntimePresetWorldV1 = { fixtureId: "prefix-world", actors: [], resourceGrants: [], protectedRoutes: [route] };

function sample(tick = 0): AiRuntimePlacementClearanceV1 {
  return { clockTick: tick, snapshotRestoreInProgress: false, sceneActive: true, gaps: [], routes: [{
    declaration: route, fromTile: { x: 1, y: 1 }, toTile: { x: 3, y: 1 }, status: "path",
    path: [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }], visitedTiles: 8, gaps: []
  }] };
}

/** Synthetic reader inputs exercise rejection paths only; these are not native scenario evidence. */
function input(): Parameters<typeof evaluateRuntimePlacementPrefixes>[1] {
  const execution = { schemaVersion: 1 as const, commandId: "build-first", commitmentKey: "first-site",
    source: "human" as const, authorityEpoch: 1, sequence: 1 };
  const command = { type: ProbableWaffleGameCommandTypes.Construct, actorName: ObjectNames.Wall,
    playerNumber: 2, actorIds: ["builder"], tileVec3: { x: 10, y: 10, z: 0 }, siteKey: "first-site", tick: 0, execution };
  return {
    productionPreset: {
      fixtureId: preset.fixtureId, sourceRevision: "a".repeat(40), fixtureDigest: "fnv1a32:12345678",
      createdActorNames: [], createdActorIds: {}, resourceGrantCount: 0, resourceStartCount: 0, queuedItemCount: 0,
      initialQueueItems: [], queueApplications: [], initialOrderCount: 0, eventResults: [], placementBaseline: sample()
    },
    productionCapture: {
      schemaVersion: 1, kind: "production_authority_capture", startedTick: 0, playerNumber: 2,
      droppedFactCount: 0, droppedSnapshotCount: 0, gaps: [], snapshots: [], facts: [
        { kind: "spatial_authority", sequence: 1, tick: 0, playerNumber: 2, spatial: {
          kind: "placement", command, site: { actorId: "site", objectName: "Wall", canonicalObjectName: "Wall",
            playerNumber: 2, active: true, alive: true, finished: false, indexed: true },
          footprint: [{ x: 10, y: 10 }], legal: true, clockTick: 0, sceneActive: true,
          snapshotRestoreInProgress: false, gaps: [], clearance: sample()
        } },
        { kind: "outcome", sequence: 2, tick: 0, playerNumber: 2, scheduledTick: null, outcome: {
          ...execution, playerNumber: 2, tick: 0, kind: "applied", reason: "applied", actorIds: ["builder"], worldLinkIds: ["site"]
        } },
        { kind: "command_delivered", sequence: 3, tick: 0, playerNumber: 2, command }
      ]
    }
  };
}

test.describe("placement-prefix binding reader", () => {
  test("rejects missing setup, missing per-prefix measurement and wrong route width", () => {
    expect(evaluateRuntimePlacementPrefixes(preset, {}, 1)).toContain("placement_prefix_capture_or_scope_missing");
    const world = input(), capture = world.productionCapture;
    if (!capture) throw new Error("authored input missing");
    const missing = { ...world, productionCapture: { ...capture, facts: capture.facts.filter((fact) => fact.kind !== "spatial_authority") } };
    expect(evaluateRuntimePlacementPrefixes(preset, missing, 1)).toContain("placement_prefix_measurement_missing:build-first");
    const wrongWidth = { ...world, productionCapture: { ...capture, facts: capture.facts.map((fact) =>
      fact.kind !== "spatial_authority" || fact.spatial.kind !== "placement" ? fact : { ...fact,
        spatial: { ...fact.spatial, clearance: { ...sample(), routes: sample().routes.map((entry) =>
          ({ ...entry, declaration: { ...entry.declaration, tileMargin: 0 } })) } } }
    ) } };
    expect(evaluateRuntimePlacementPrefixes(preset, wrongWidth, 1))
      .toContain("build-first:placement_clearance_binding_mismatch:army-retreat");
  });

  test("does not accept final access after an earlier applied prefix sealed the route", () => {
    const world = input(), capture = world.productionCapture;
    if (!capture) throw new Error("authored input missing");
    const facts = capture.facts.map((fact) => fact.kind !== "spatial_authority" || fact.spatial.kind !== "placement" ? fact : {
      ...fact, spatial: { ...fact.spatial, clearance: { ...sample(), routes: sample().routes.map((entry) =>
        ({ ...entry, status: "blocked" as const, path: null })) } }
    });
    const originalPlacement = capture.facts[0], originalOutcome = capture.facts[1], originalDelivery = capture.facts[2];
    if (originalPlacement?.kind !== "spatial_authority" || originalPlacement.spatial.kind !== "placement" ||
        originalOutcome?.kind !== "outcome" || originalDelivery?.kind !== "command_delivered" ||
        originalDelivery.command.type !== ProbableWaffleGameCommandTypes.Construct || !originalDelivery.command.execution) {
      throw new Error("authored facts missing");
    }
    const command = { ...originalDelivery.command, execution: { ...originalDelivery.command.execution, commandId: "build-second" } };
    facts.push(
      { ...originalPlacement, tick: 10, sequence: 4, spatial: { ...originalPlacement.spatial, command,
        site: { ...originalPlacement.spatial.site, actorId: "second-site" }, clearance: sample(10), clockTick: 10 } },
      { ...originalOutcome, tick: 10, sequence: 5, outcome: { ...originalOutcome.outcome,
        tick: 10, commandId: "build-second", worldLinkIds: ["second-site"] } },
      { ...originalDelivery, tick: 10, sequence: 6, command }
    );
    expect(evaluateRuntimePlacementPrefixes(preset, { ...world, productionCapture: { ...capture, facts } }, 2))
      .toContain("build-first:placement_clearance_route_blocked_or_unproved:army-retreat");
  });

  test("rejects reordered or dropped history and refuses empty work as a successful prefix batch", () => {
    const world = input(), capture = world.productionCapture;
    if (!capture) throw new Error("authored input missing");
    expect(evaluateRuntimePlacementPrefixes(preset, { ...world, productionCapture: { ...capture, droppedFactCount: 1 } }, 1))
      .toContain("placement_prefix_capture_or_scope_missing");
    expect(evaluateRuntimePlacementPrefixes(preset, { ...world, productionCapture: { ...capture, facts: [...capture.facts].reverse() } }, 1))
      .toContain("placement_prefix_history_reordered_or_cross_owner");
    expect(evaluateRuntimePlacementPrefixes(preset, { ...world, productionCapture: { ...capture, facts: [] } }, 1))
      .toContain("placement_prefix_required_builds_missing");
  });
});
