import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import { ResourceType, type GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";
import Phaser from "phaser";
import { AI_DECISION_DISPATCH_EVENT, type AiDecisionDispatchEvent } from "../ai-decision-dispatch-event";
import { AI_INTENT_COMMAND_DISPATCH_EVENT } from "../ai-intent-command-dispatch-event";
import {
  pendingCommandFinished,
  pendingCommandOutcome,
  pendingCommandRequest
} from "./ai-runtime-pending-command-fixtures";
import { productionCaptureFixture as setup } from "./ai-runtime-production-capture-fixtures";
import { unspentClaimFixture } from "./ai-runtime-unspent-claim-fixtures";
jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({
  getPlayer: jest.fn(),
  getCommunicator: jest.fn(),
  emitResource: jest.fn(),
  isSnapshotApplyInProgress: jest.fn()
}));
jest.mock("../../../world/services/scene-component-helpers", () => ({
  getSceneService: jest.fn(),
  getSceneSystem: jest.fn()
}));
function outcome(kind: GameCommandOutcome["kind"], commandId = "cancel-request"): GameCommandOutcome {
  return {
    schemaVersion: 1,
    kind,
    reason: "applied",
    tick: 0,
    playerNumber: 2,
    commandId,
    commitmentKey: "queue:producer",
    authorityEpoch: 1,
    sequence: 1,
    actorIds: ["producer"],
    worldLinkIds: []
  };
}
describe("AiRuntimeProductionCapture decision boundaries", () => {
  it("retains the cash frame before new selected claims independently of the accepting boundary", () => {
    const f = setup(),
      { decision } = unspentClaimFixture();
    f.ticks.currentTick = 100;
    f.scene.events.emit(AI_DECISION_DISPATCH_EVENT, {
      ...decision,
      acceptedIntents: [],
      decisions: [],
      reservations: [],
      identity: { ...decision.identity, decisionSequence: 0 }
    } satisfies AiDecisionDispatchEvent);
    f.scene.events.emit(AI_DECISION_DISPATCH_EVENT, decision);
    const selected = requireAiTestEntry(
      f.capture.capture(2).facts.filter((fact) => fact.kind === "decision_selected"),
      1
    );
    expect(selected.unspentClaimsBeforeSelection).toMatchObject({ resources: { food: 0 }, gaps: [] });
    expect(selected.boundaryState?.unspentClaims).toMatchObject({ resources: { food: 35 }, gaps: [] });
    expect(selected.unspentClaimsBeforeSelection).not.toBe(selected.boundaryState?.unspentClaims);
    expect(selected.decision).toEqual(decision);
    f.capture.dispose();
  });

  it("retains actual buffered request time, intended execution tick and unspent AI claims independently of queue liabilities", () => {
    const fixture = setup();
    fixture.ticks.currentTick = 100;
    fixture.scene.events.emit(AI_INTENT_COMMAND_DISPATCH_EVENT, pendingCommandRequest());
    fixture.outcomes.next(pendingCommandOutcome());
    fixture.scene.events.emit(AI_INTENT_COMMAND_DISPATCH_EVENT, pendingCommandFinished());
    const captured = fixture.capture.capture(2);
    expect(captured.facts.map((fact) => [fact.sequence, fact.tick, fact.kind])).toEqual([
      [1, 100, "intent_dispatch"],
      [2, 100, "outcome"],
      [3, 100, "intent_dispatch"]
    ]);
    const admitted = requireAiTestEntry(captured.facts, 1);
    expect(admitted.kind === "outcome" && admitted.scheduledTick).toBe(102);
    expect(admitted.kind === "outcome" && admitted.outcome.tick).toBe(102);
    expect(admitted.kind === "outcome" && admitted.boundaryStateBefore?.pendingResourceClaims?.food).toBe(0);
    expect(admitted.boundaryState?.pendingResourceClaims?.food).toBe(35);
    expect(admitted.boundaryState?.obligations?.food).toBe(28);
    expect(requireAiTestEntry(captured.snapshots, 0).pendingResourceClaims?.food).toBe(35);
    expect(requireAiTestEntry(captured.snapshots, 0).resources.food).toBe(100);
    expect(requireAiTestEntry(captured.snapshots, 0).obligations.food).toBe(28);
    fixture.ticks.currentTick = 102;
    fixture.outcomes.next(pendingCommandOutcome("applied"));
    const after = fixture.capture.capture(2);
    expect(requireAiTestEntry(after.snapshots, 1).pendingCommands).toEqual([]);
    const applied = after.facts.at(-1);
    expect(applied?.kind === "outcome" && applied.boundaryStateBefore?.pendingResourceClaims?.food).toBe(35);
    expect(applied?.boundaryState?.pendingResourceClaims?.food).toBe(0);
    expect(requireAiTestEntry(after.snapshots, 1).pendingResourceClaims?.food).toBe(0);
    expect(requireAiTestEntry(captured.snapshots, 0).pendingResourceClaims?.food).toBe(35);
    expect(after.gaps).toContain("pending_dispatch_before_capture_or_restore");
    fixture.scene.events.emit(Phaser.Scenes.Events.SHUTDOWN);
    expect(fixture.scene.events.listenerCount(AI_INTENT_COMMAND_DISPATCH_EVENT)).toBe(0);
    expect(fixture.outcomes.observed).toBe(false);
  });

  it("retains a selected result separately from saved leases and fails absent queue authority to null", () => {
    const f = setup();
    const decision = {
      identity: { playerNumber: 2, tick: 0, generation: 7, decisionSequence: 8, authorityEpoch: 1 },
      input: {
        observation: null,
        capabilityCatalog: null,
        accessGraph: null,
        cadence: { clock: "simulation", tick: 0, configuredIntervalTicks: 5, completedBefore: 3 },
        snapshotRestoreInProgress: false,
        gaps: ["production_decision_observation_overflow"]
      },
      acceptedIntents: [],
      decisions: [],
      economyProduction: f.state.economyProduction,
      reservations: [
        {
          claimId: "claim:selected",
          ownerPlanId: "plan:force",
          subjectKey: "resource:food:35",
          state: {
            kind: "provisional",
            expiresAt: { clock: "simulation", unit: "tick", dueTick: 20, persistence: "save" }
          },
          prerequisites: [],
          createdTick: 0
        }
      ]
    } satisfies AiDecisionDispatchEvent;
    f.scene.events.emit(AI_DECISION_DISPATCH_EVENT, decision);
    f.outcomes.next(outcome("dispatched"));
    requireAiTestEntry(f.queuedItems, 0).remainingTime = Number.NaN;
    f.outcomes.next(outcome("active"));
    requireAiTestEntry(f.queuedItems, 0).remainingTime = 100;
    const captured = f.capture.capture(2);
    const selected = requireAiTestEntry(captured.facts, 0);
    expect(selected.kind === "decision_selected" && selected.decision).toEqual(decision);
    expect(selected.kind === "decision_selected" && selected.decision.reservations).not.toBe(decision.reservations);
    expect(selected.kind === "decision_selected" && selected.decision.input).not.toBe(decision.input);
    expect(selected.kind === "decision_selected" && selected.decision.input?.cadence.completedBefore).toBe(3);
    expect(requireAiTestEntry(captured.facts, 1).boundaryState?.brain?.reservations).toEqual([]);
    expect(requireAiTestEntry(captured.facts, 1).boundaryState?.brain?.decisionSequence).toBe(0);
    expect(requireAiTestEntry(captured.facts, 2).boundaryState?.obligations).toBeNull();
    expect(requireAiTestEntry(captured.facts, 2).boundaryState?.queues).toBeNull();
    expect(requireAiTestEntry(captured.facts, 2).boundaryState?.gaps).toContain(
      "production_boundary_queue_authority_invalid"
    );
    f.scene.events.emit(Phaser.Scenes.Events.SHUTDOWN);
    expect(f.scene.events.listenerCount(AI_DECISION_DISPATCH_EVENT)).toBe(0);
  });

  it("retains request, synchronous refund and terminal callback order without inventing item attribution", () => {
    const fixture = setup();
    const initial = fixture.capture.capture(2);
    expect(requireAiTestEntry(initial.snapshots, 0)?.afterSequence).toBe(0);
    fixture.outcomes.next(outcome("dispatched"));
    fixture.money.food += 7;
    fixture.changes.next({
      property: "resource.added",
      data: { playerNumber: 2, playerStateData: { resources: { [ResourceType.Food]: 7 } } }
    });
    fixture.outcomes.next(outcome("cancelled"));
    fixture.commands.next({
      type: "CANCEL_PRODUCTION",
      tick: 0,
      playerNumber: 2,
      actorIds: ["producer"],
      queueIndex: 0
    });
    const capture = fixture.capture.capture(2);
    expect(capture.facts.map((fact) => [fact.sequence, fact.tick, fact.kind])).toEqual([
      [1, 0, "outcome"],
      [2, 0, "resources_applied"],
      [3, 0, "outcome"],
      [4, 0, "command_delivered"]
    ]);
    const cash = capture.facts.find((fact) => fact.kind === "resources_applied");
    expect(cash?.kind === "resources_applied" && cash.balanceMatches).toBe(true);
    expect(cash?.kind === "resources_applied" && cash.before.food).toBe(100);
    expect(cash?.kind === "resources_applied" && cash.after.food).toBe(107);
    expect(capture.gaps).toContain("resource_item_attribution");
    expect(capture.snapshots.at(-1)?.afterSequence).toBe(4);
    fixture.capture.dispose();
  });

  it("marks unobserved balance mutation and dropped records, rejecting unsettled and disposed boundaries", () => {
    const fixture = setup();
    fixture.money.food += 1;
    fixture.changes.next({ property: "resource.added", data: { playerNumber: 2, playerStateData: { resources: {} } } });
    const cash = requireAiTestEntry(fixture.capture.capture(2).facts, 0);
    expect(cash.kind === "resources_applied" && cash.balanceMatches).toBe(false);
    for (let index = 0; index < 8193; index += 1) fixture.outcomes.next(outcome("dispatched", `request:${index}`));
    const bounded = fixture.capture.capture(2);
    expect(bounded.facts).toHaveLength(8192);
    expect(bounded.droppedFactCount).toBe(2);
    for (let index = 0; index < 256; index += 1) fixture.capture.capture(2);
    expect(fixture.capture.capture(2).droppedSnapshotCount).toBeGreaterThan(0);
    fixture.ticks.currentTick = 1;
    fixture.controller.isDecisionBoundarySettled.mockReturnValue(false);
    expect(() => fixture.capture.capture(2)).toThrow("production_capture_boundary_unsettled");
    fixture.capture.dispose();
    fixture.capture.dispose();
    expect(fixture.outcomes.observed).toBe(false);
    expect(fixture.queueChanges.observed).toBe(false);
    expect(() => fixture.capture.capture(2)).toThrow("production_capture_disposed");
  });
});
