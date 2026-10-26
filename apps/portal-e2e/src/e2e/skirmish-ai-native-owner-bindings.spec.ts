import { evaluateNativeBundles } from "./skirmish-ai-native-bundle-evaluation";
import { expect, test } from "@playwright/test";
import type { AiRuntimeProductionCaptureV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import { runtimeClosedHistoryFailures } from "./skirmish-ai-runtime-closed-history";
import { runtimeControlTransitFailures } from "./skirmish-ai-runtime-control-transit";
import { evaluateFortificationAccessWorld } from "./skirmish-ai-fortification-access-evaluation";
import { evaluateExpansionWorld } from "./skirmish-ai-expansion-world-evaluation";
import { evaluateNativeAuthority } from "./skirmish-ai-native-authority-evaluation";
import { backlogFailures, nativeIntentOperation } from "./skirmish-ai-native-authority-evaluation";
import type { AiIntentV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/contracts/ai-intent-v1";
import { evaluateNativeResourcePriority } from "./skirmish-ai-native-resource-priority-evaluation";
import { evaluateNativeFault, nativeFaultReceiptReconciled } from "./skirmish-ai-native-fault-evaluation";
import { evaluateNativeScarceRecovery } from "./skirmish-ai-native-scarce-recovery-evaluation";
import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";

test("transport annotations and empty decision history cannot certify native authority or resource progress", () => {
  const context = {
    frames: [],
    facts: [],
    roles: {},
    capture: undefined,
    result: { presetInitialQueueItems: [], perturbations: [] }
  } as unknown as ReturnType<typeof nativeScenarioContext>;
  expect(evaluateNativeAuthority("H-06", "withheld", context)).toContain(
    "authority_no_original_ai_receipt_actually_held"
  );
  expect(evaluateNativeAuthority("H-10", "over_capacity", context)).toContain(
    "authority_configured_native_backlog_premise_missing"
  );
  expect(evaluateNativeResourcePriority("H-13", "many_bases", context)).toContain(
    "resources_real_multiple_base_budget_premise_missing"
  );
  expect(evaluateNativeResourcePriority("H-14", "harmless", context)).toContain(
    "priorities_native_harmless_scout_role_missing"
  );
  expect(evaluateNativeResourcePriority("H-15", "lethal", context)).toContain(
    "priorities_native_lethal_attack_and_effective_survival_missing"
  );
  expect(evaluateNativeBundles("scarce", context)).toContain("bundles_real_competing_wood_stone_projects_missing");
  expect(evaluateNativeScarceRecovery("infeasible", context)).toContain("scarce_native_definition_setup_missing");
  expect(evaluateNativeFault("debug", context)).toContain("fault_real_boundary_injection_missing");
});

test("a completed native command may clear pending ownership before its held receipt is released", () => {
  const commandId = "native-command-1";
  const delivery = (tick: number, phase: "held" | "released", kind: string) => ({
    kind: "authority_delivery",
    sequence: tick,
    tick,
    playerNumber: 2,
    delivery: {
      faultId: "delayed-receipt",
      playerNumber: 2,
      tick,
      phase,
      outcome: { schemaVersion: 1, kind, reason: "applied", tick: 120, playerNumber: 2, commandId }
    }
  });
  const context = {
    facts: [delivery(120, "held", "applied"), delivery(319, "held", "completed"), delivery(801, "released", "completed")],
    frames: [
      {
        tick: 200,
        decision: {
          missionState: {
            lanes: [],
            waitEdges: [],
            authority: {},
            pendingOutcomes: [{ identity: { commandId: `command:${commandId}` }, kind: "dispatched" }]
          },
          economyProduction: { posture: { status: "emergency" } },
          acceptedIntents: []
        }
      },
      {
        tick: 2000,
        decision: {
          missionState: { lanes: [], waitEdges: [], authority: {}, pendingOutcomes: [] },
          economyProduction: { posture: { status: "normal" } },
          acceptedIntents: []
        }
      }
    ],
    roles: {},
    capture: undefined,
    result: { perturbations: [] }
  } as unknown as ReturnType<typeof nativeScenarioContext>;

  expect(evaluateNativeResourcePriority("H-15", "resolved", context)).not.toContain(
    "priorities_emergency_did_not_reconcile_original_delayed_receipt"
  );
});

test("the H-15 distant-threat control does not require an unrelated delayed production receipt", () => {
  const context = {
    facts: [],
    frames: [{ tick: 200, decision: {
      missionState: { lanes: [], waitEdges: [], authority: {} },
      economyProduction: { posture: { status: "safe" } },
      input: { observation: { actors: [{ actorId: "distant-attacker", visibility: "visible" }] } },
      acceptedIntents: []
    } }],
    roles: { "lethal-attacker-0": "distant-attacker" },
    capture: undefined,
    result: { perturbations: [] }
  } as unknown as ReturnType<typeof nativeScenarioContext>;

  expect(evaluateNativeResourcePriority("H-15", "far", context)).not.toContain(
    "priorities_emergency_did_not_reconcile_original_delayed_receipt"
  );
});

test("authority retry matching distinguishes different operations under one demand from the same operation", () => {
  const construction = (siteKey: string) =>
    ({
      kind: "construct",
      demandId: "demand:food",
      effectId: `effect:${siteKey}`,
      builderIds: ["worker-1"],
      objectName: "Field",
      logicalPosition: { x: 29, y: 22, z: 0 },
      siteKey
    }) as unknown as AiIntentV1;
  expect(nativeIntentOperation(construction("29,22"))).toBe(nativeIntentOperation(construction("29,22")));
  expect(nativeIntentOperation(construction("29,22"))).not.toBe(nativeIntentOperation(construction("29,19")));
});

test("fault recovery accepts a terminal receipt applied between samples once identity drains after release", () => {
  const commandId = "2:0:119:runtime-fixture";
  const outcome = (kind: string, tick: number) => ({
    kind: "outcome", tick, playerNumber: 2,
    outcome: { commandId, kind, sequence: 119, authorityEpoch: 0 }
  });
  const delivery = (tick: number, phase: "held" | "released", kind: string) => ({
    kind: "authority_delivery", tick, playerNumber: 2,
    delivery: { phase, tick, outcome: { commandId, kind, sequence: 119, authorityEpoch: 0 } }
  });
  const decision = (tick: number, pendingCommandIds: string[]) => ({
    tick, decision: { missionState: { authority: { health: "healthy", pendingCommandIds } } }
  });
  const pendingId = `command:${commandId}`;
  const context = {
    facts: [delivery(120, "held", "applied"), delivery(319, "held", "completed"),
      outcome("completed", 319), delivery(801, "released", "completed")],
    frames: [decision(200, [pendingId]), decision(820, [])]
  } as unknown as ReturnType<typeof nativeScenarioContext>;

  expect(nativeFaultReceiptReconciled(context)).toBe(true);
  expect(nativeFaultReceiptReconciled({ ...context, frames: [decision(200, [pendingId])] } as unknown as
    ReturnType<typeof nativeScenarioContext>)).toBe(false);
});

test("authority backlog drains terminal receipts while preserving live gather commands", () => {
  const held = Array.from({ length: 128 }, (_, index) => `command:held-${index}`);
  const state = (tick: number, pendingCommandIds: string[], rejected = false) => ({
    tick,
    decision: {
      missionState: { authority: { pendingLimit: 128, pendingCommandIds } },
      decisions: rejected ? [{ outcome: "rejected", detail: "authority_backpressure" }] : [],
      acceptedIntents: []
    }
  });
  const context = {
    frames: [state(1, held), state(2, held, true), state(1802, held.slice(-2))],
    facts: [
      { kind: "authority_delivery", delivery: { phase: "history_unavailable" } },
      ...held
        .slice(0, -2)
        .map((id) => ({ kind: "outcome", outcome: { commandId: id.slice("command:".length), kind: "completed" } }))
    ]
  } as unknown as ReturnType<typeof nativeScenarioContext>;
  const failures = backlogFailures("over_capacity", context, held);
  expect(failures).not.toContain("authority_unresolved_identity_evicted_before_receipt_or_history_return");
  expect(failures).not.toContain("authority_native_capacity_boundary_not_actually_reached");
  expect(failures).toContain("authority_backlog_did_not_drain_and_resume_native_work");
});

test("a delayed consumer receipt may remain pending until the native terminal result is observed", () => {
  const outcome = {
    commandId: "gather-1",
    sequence: 7,
    authorityEpoch: 2,
    effectId: "effect:gather-1"
  };
  const delivery = (tick: number, phase: "held" | "released") => ({
    tick,
    playerNumber: 2,
    faultId: "original-ai-receipt",
    pendingCount: 1,
    phase,
    outcome
  });
  const frame = (tick: number, pending: boolean) => ({
    tick,
    decision: {
      missionState: {
        authority: { pendingCommandIds: pending ? ["command:gather-1"] : [] },
        pendingOutcomes: []
      }
    }
  });
  const context = {
    frames: [frame(1_202, true), frame(1_300, true), frame(1_320, false)],
    facts: [
      { kind: "authority_delivery", tick: 1_000, delivery: delivery(1_000, "held") },
      { kind: "authority_delivery", tick: 1_201, delivery: delivery(1_201, "released") },
      { kind: "outcome", tick: 1_300, outcome: { ...outcome, kind: "failed" } }
    ]
  } as unknown as ReturnType<typeof nativeScenarioContext>;

  expect(evaluateNativeAuthority("H-10", "over_capacity", context)).not.toContain(
    "authority_late_original_receipt_resurrected_settled_work"
  );
});

/** Synthetic negative inputs test evidence readers; no native scenario execution is implied. */
function receiptOnly(): AiRuntimeProductionCaptureV1 {
  const execution = {
    schemaVersion: 1 as const,
    commandId: "move-one",
    commitmentKey: "probe-one",
    source: "human" as const,
    authorityEpoch: 1,
    sequence: 1
  };
  return {
    schemaVersion: 1,
    kind: "production_authority_capture",
    startedTick: 0,
    playerNumber: 1,
    droppedFactCount: 0,
    droppedSnapshotCount: 0,
    snapshots: [],
    gaps: [],
    facts: [
      {
        sequence: 1,
        tick: 10,
        playerNumber: 1,
        kind: "preset_control",
        control: {
          id: "probe-move",
          playerNumber: 1,
          actorId: "probe",
          phase: "requested",
          requestedTick: 10,
          scheduledTick: 10,
          setupItemId: null,
          command: null,
          outcomes: []
        }
      },
      {
        sequence: 2,
        tick: 10,
        playerNumber: 1,
        kind: "preset_control",
        control: {
          id: "probe-move",
          playerNumber: 1,
          actorId: "probe",
          phase: "applied",
          requestedTick: 10,
          scheduledTick: 10,
          setupItemId: null,
          command: {
            type: "MOVE",
            playerNumber: 1,
            actorIds: ["probe"],
            tileVec3: { x: 12, y: 14, z: 0 },
            worldVec3: { x: 320, y: 240, z: 0 },
            queue: false,
            tick: 10,
            execution
          },
          outcomes: [
            {
              ...execution,
              playerNumber: 1,
              tick: 10,
              kind: "applied",
              reason: "applied",
              actorIds: ["probe"],
              worldLinkIds: []
            }
          ]
        }
      }
    ]
  };
}

test("shared command receipts cannot substitute for a physical arrival or a measured blocked attempt", () => {
  const capture = receiptOnly();
  expect(runtimeControlTransitFailures(capture, "probe-move", 800, "arrive")).toContain(
    "native_transit_original_endpoint_missing:probe-move"
  );
  expect(runtimeControlTransitFailures(capture, "probe-move", 800, "blocked")).toContain(
    "native_transit_blocked_control_unproved:probe-move"
  );
  const unavailable = {
    ...capture,
    facts: capture.facts.map((fact) =>
      fact.kind !== "preset_control"
        ? fact
        : {
            ...fact,
            control: { ...fact.control, phase: "unavailable" as const, command: null, outcomes: [] }
          }
    )
  };
  expect(runtimeControlTransitFailures(unavailable, "probe-move", 800, "arrive")).toContain(
    "native_transit_control_missing:probe-move"
  );
});

test("an accepted dispatch still requires caller-attributed physical arrival", () => {
  const capture = receiptOnly();
  const dispatched = {
    ...capture,
    facts: capture.facts.map((fact) =>
      fact.kind !== "preset_control" || fact.control.phase !== "applied"
        ? fact
        : {
            ...fact,
            control: {
              ...fact.control,
              outcomes: fact.control.outcomes.map((outcome) => ({
                ...outcome,
                kind: "dispatched" as const,
                reason: "accepted_for_dispatch" as const
              }))
            }
          }
    )
  };
  expect(runtimeControlTransitFailures(dispatched, "probe-move", 800, "arrive")).toContain(
    "native_transit_original_endpoint_missing:probe-move"
  );
});

test("closed counters without their native intervals cannot certify complete owner history", () => {
  const capture = {
    ...receiptOnly(),
    frontiers: {
      latestTick: 800,
      closedThroughTick: 800,
      requiredTicks: [800],
      intervals: [],
      gaps: []
    }
  };
  expect(runtimeClosedHistoryFailures(capture, 800)).toContain("native_closed_history_reordered_or_missing");
  expect(runtimeClosedHistoryFailures({ ...capture, droppedFactCount: 1 }, 800)).toContain(
    "native_closed_history_incomplete"
  );
  const withoutTickZero = {
    ...capture,
    frontiers: {
      ...capture.frontiers,
      intervals: [
        {
          capturedAtTick: 801,
          closedFromTick: 1,
          closedThroughTick: 800,
          afterSequence: 1,
          actors: [],
          queues: [],
          completedResearch: []
        }
      ]
    }
  };
  expect(runtimeClosedHistoryFailures(withoutTickZero, 800)).toContain("native_closed_history_reordered_or_missing");
});

test("a dispatch without the original controller request cannot certify movement", () => {
  const capture = receiptOnly();
  expect(
    runtimeControlTransitFailures({ ...capture, facts: capture.facts.slice(1) }, "probe-move", 800, "arrive")
  ).toContain("native_transit_request_boundary_invalid:probe-move");
});

test("fixture IDs and branch labels cannot supply missing expansion or fortification proof", () => {
  expect(
    evaluateFortificationAccessWorld("stairs_present", { presetCreatedActorIds: {}, perturbations: [] }, undefined)
  ).toContain("native_closed_history_incomplete");
  expect(evaluateExpansionWorld("expand", { aiFaction: "Tivara", presetCreatedActorIds: {} }, undefined)).toContain(
    "native_closed_history_incomplete"
  );
});

test("an explicitly authorized terminal prefix still requires a complete sealed native interval", () => {
  const capture = {
    ...receiptOnly(),
    frontiers: {
      latestTick: 18000,
      closedThroughTick: 800,
      requiredTicks: [18000],
      gaps: ["production_frontier_not_closed"],
      intervals: [
        {
          capturedAtTick: 801,
          closedFromTick: 0,
          closedThroughTick: 800,
          afterSequence: 2,
          actors: [],
          queues: [],
          completedResearch: []
        }
      ]
    }
  };
  expect(runtimeClosedHistoryFailures(capture, 800)).toContain("native_closed_history_incomplete");
  expect(runtimeClosedHistoryFailures(capture, 800, 18000)).toEqual([]);
  expect(
    runtimeClosedHistoryFailures({ ...capture, frontiers: { ...capture.frontiers, intervals: [] } }, 800, 18000)
  ).toContain("native_closed_history_reordered_or_missing");
  expect(
    runtimeClosedHistoryFailures(
      {
        ...capture,
        frontiers: { ...capture.frontiers, gaps: [...capture.frontiers.gaps, "production_frontier_clock_gap"] }
      },
      800,
      18000
    )
  ).toContain("native_closed_history_incomplete");
});
