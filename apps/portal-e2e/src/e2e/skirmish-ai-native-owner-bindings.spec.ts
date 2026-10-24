import { evaluateNativeBundles } from "./skirmish-ai-native-bundle-evaluation";
import { expect, test } from "@playwright/test";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import { runtimeClosedHistoryFailures } from "./skirmish-ai-runtime-closed-history";
import { runtimeControlTransitFailures } from "./skirmish-ai-runtime-control-transit";
import { evaluateFortificationAccessWorld } from "./skirmish-ai-fortification-access-evaluation";
import { evaluateExpansionWorld } from "./skirmish-ai-expansion-world-evaluation";
import { evaluateNativeAuthority } from "./skirmish-ai-native-authority-evaluation";
import { evaluateNativeResourcePriority } from "./skirmish-ai-native-resource-priority-evaluation";
import { evaluateNativeFault } from "./skirmish-ai-native-fault-evaluation";
import { evaluateNativeScarceRecovery } from "./skirmish-ai-native-scarce-recovery-evaluation";
import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";

test("transport annotations and empty decision history cannot certify native authority or resource progress", () => {
  const context = { frames: [], facts: [], roles: {}, capture: undefined,
    result: { presetInitialQueueItems: [], perturbations: [] } } as unknown as ReturnType<typeof nativeScenarioContext>;
  expect(evaluateNativeAuthority("H-06", "withheld", context)).toContain("authority_no_original_ai_receipt_actually_held");
  expect(evaluateNativeAuthority("H-10", "over_capacity", context))
    .toContain("authority_configured_native_backlog_premise_missing");
  expect(evaluateNativeResourcePriority("H-13", "many_bases", context))
    .toContain("resources_real_multiple_base_budget_premise_missing");
  expect(evaluateNativeResourcePriority("H-14", "harmless", context)).toContain("priorities_native_harmless_scout_role_missing");
  expect(evaluateNativeResourcePriority("H-15", "lethal", context))
    .toContain("priorities_native_lethal_attack_and_effective_survival_missing");
  expect(evaluateNativeBundles("scarce", context)).toContain("bundles_real_competing_wood_stone_projects_missing");
  expect(evaluateNativeScarceRecovery("infeasible", context)).toContain("scarce_native_definition_setup_missing");
  expect(evaluateNativeFault("debug", context)).toContain("fault_real_boundary_injection_missing");
});

/** Synthetic negative inputs test evidence readers; no native scenario execution is implied. */
function receiptOnly(): AiRuntimeProductionCaptureV1 {
  const execution = { schemaVersion: 1 as const, commandId: "move-one", commitmentKey: "probe-one",
    source: "human" as const, authorityEpoch: 1, sequence: 1 };
  return { schemaVersion: 1, kind: "production_authority_capture", startedTick: 0, playerNumber: 1,
    droppedFactCount: 0, droppedSnapshotCount: 0, snapshots: [], gaps: [], facts: [{
      sequence: 1, tick: 10, playerNumber: 1, kind: "preset_control", control: {
        id: "probe-move", playerNumber: 1, actorId: "probe", phase: "requested", requestedTick: 10, scheduledTick: 10,
        setupItemId: null, command: null, outcomes: []
      }
    }, {
      sequence: 2, tick: 10, playerNumber: 1, kind: "preset_control", control: {
        id: "probe-move", playerNumber: 1, actorId: "probe", phase: "applied", requestedTick: 10, scheduledTick: 10,
        setupItemId: null, command: { type: "MOVE", playerNumber: 1, actorIds: ["probe"],
          tileVec3: { x: 12, y: 14, z: 0 }, worldVec3: { x: 320, y: 240, z: 0 }, queue: false, tick: 10, execution },
        outcomes: [{ ...execution, playerNumber: 1, tick: 10, kind: "applied", reason: "applied",
          actorIds: ["probe"], worldLinkIds: [] }]
      }
    }] };
}

test("shared command receipts cannot substitute for a physical arrival or a measured blocked attempt", () => {
  const capture = receiptOnly();
  expect(runtimeControlTransitFailures(capture, "probe-move", 800, "arrive"))
    .toContain("native_transit_original_endpoint_missing:probe-move");
  expect(runtimeControlTransitFailures(capture, "probe-move", 800, "blocked"))
    .toContain("native_transit_blocked_control_unproved:probe-move");
  const unavailable = { ...capture, facts: capture.facts.map((fact) => fact.kind !== "preset_control" ? fact : {
    ...fact, control: { ...fact.control, phase: "unavailable" as const, command: null, outcomes: [] }
  }) };
  expect(runtimeControlTransitFailures(unavailable, "probe-move", 800, "arrive"))
    .toContain("native_transit_control_missing:probe-move");
});

test("closed counters without their native intervals cannot certify complete owner history", () => {
  const capture = { ...receiptOnly(), frontiers: {
    latestTick: 800, closedThroughTick: 800, requiredTicks: [800], intervals: [], gaps: []
  } };
  expect(runtimeClosedHistoryFailures(capture, 800)).toContain("native_closed_history_reordered_or_missing");
  expect(runtimeClosedHistoryFailures({ ...capture, droppedFactCount: 1 }, 800))
    .toContain("native_closed_history_incomplete");
  const withoutTickZero = { ...capture, frontiers: { ...capture.frontiers, intervals: [{
    capturedAtTick: 801, closedFromTick: 1, closedThroughTick: 800, afterSequence: 1,
    actors: [], queues: [], completedResearch: []
  }] } };
  expect(runtimeClosedHistoryFailures(withoutTickZero, 800)).toContain("native_closed_history_reordered_or_missing");
});

test("a dispatch without the original controller request cannot certify movement", () => {
  const capture = receiptOnly();
  expect(runtimeControlTransitFailures({ ...capture, facts: capture.facts.slice(1) }, "probe-move", 800, "arrive"))
    .toContain("native_transit_request_boundary_invalid:probe-move");
});

test("fixture IDs and branch labels cannot supply missing expansion or fortification proof", () => {
  expect(evaluateFortificationAccessWorld("stairs_present", { presetCreatedActorIds: {}, perturbations: [] }, undefined))
    .toContain("native_closed_history_incomplete");
  expect(evaluateExpansionWorld("expand", { aiFaction: "Tivara", presetCreatedActorIds: {} }, undefined))
    .toContain("native_closed_history_incomplete");
});

test("an explicitly authorized terminal prefix still requires a complete sealed native interval", () => {
  const capture = { ...receiptOnly(), frontiers: { latestTick: 18000, closedThroughTick: 800,
    requiredTicks: [18000], gaps: ["production_frontier_not_closed"], intervals: [{
      capturedAtTick: 801, closedFromTick: 0, closedThroughTick: 800, afterSequence: 2,
      actors: [], queues: [], completedResearch: []
    }] } };
  expect(runtimeClosedHistoryFailures(capture, 800)).toContain("native_closed_history_incomplete");
  expect(runtimeClosedHistoryFailures(capture, 800, 18000)).toEqual([]);
  expect(runtimeClosedHistoryFailures({ ...capture, frontiers: { ...capture.frontiers, intervals: [] } }, 800, 18000))
    .toContain("native_closed_history_reordered_or_missing");
  expect(runtimeClosedHistoryFailures({ ...capture, frontiers: { ...capture.frontiers,
    gaps: [...capture.frontiers.gaps, "production_frontier_clock_gap"] } }, 800, 18000))
    .toContain("native_closed_history_incomplete");
});
