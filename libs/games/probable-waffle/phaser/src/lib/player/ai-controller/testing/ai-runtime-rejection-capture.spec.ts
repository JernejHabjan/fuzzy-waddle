import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import Phaser from "phaser";
import { AI_DECISION_DISPATCH_EVENT } from "../ai-decision-dispatch-event";
import { AI_INTENT_COMMAND_DISPATCH_EVENT } from "../ai-intent-command-dispatch-event";
import { isSnapshotApplyInProgress } from "../../../data/scene-data";
import { productionCaptureFixture } from "./ai-runtime-production-capture-fixtures";
import { unspentClaimFixture } from "./ai-runtime-unspent-claim-fixtures";
import { pendingCommandOutcome } from "./ai-runtime-pending-command-fixtures";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({ getPlayer: jest.fn(), isSnapshotApplyInProgress: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({
  getSceneService: jest.fn(),
  getSceneSystem: jest.fn()
}));

describe("native rejection callback capture", () => {
  it("detaches the exact selected claim before receipt release without a fabricated admission/item", () => {
    const f = productionCaptureFixture();
    const scope = unspentClaimFixture();
    jest.mocked(isSnapshotApplyInProgress).mockReturnValue(false);
    f.ticks.currentTick = scope.decision.identity.tick;
    f.scene.events.emit(AI_DECISION_DISPATCH_EVENT, scope.decision);
    f.scene.events.emit(AI_INTENT_COMMAND_DISPATCH_EVENT, scope.request);
    f.scene.events.emit(AI_INTENT_COMMAND_DISPATCH_EVENT, {
      kind: "finished",
      playerNumber: 2,
      correlation: scope.request.correlation,
      receipt: { status: "rejected", reason: "invalid_owner" }
    });
    const raw = f.capture.capture(2);
    const receipt = raw.facts.at(-1);
    if (receipt?.kind !== "intent_dispatch") throw new Error("synthetic_receipt_missing");
    expect(receipt.boundaryStateBefore?.unspentClaims?.resources?.food).toBe(35);
    expect(receipt.boundaryState?.unspentClaims?.resources?.food).toBe(0);
    expect(receipt.boundaryStateBefore?.resources).toEqual(receipt.boundaryState?.resources);
    expect(receipt.boundaryStateBefore?.queues).toEqual(receipt.boundaryState?.queues);
    expect(receipt.boundaryState?.snapshotRestoreInProgress).toBe(false);
    expect(requireAiTestEntry(receipt.boundaryState?.unspentClaims?.entries, 0)).toMatchObject({
      commandId: null,
      state: "released"
    });
    expect(raw.facts.some((fact) => fact.kind === "outcome")).toBe(false);
    f.money.food = 1;
    expect(receipt.boundaryStateBefore?.resources?.food).toBe(100);
    f.scene.events.emit(Phaser.Scenes.Events.SHUTDOWN);
    expect(f.scene.events.listenerCount(AI_INTENT_COMMAND_DISPATCH_EVENT)).toBe(0);
  });

  it("keeps the actual admitted claim and future schedule separate from application rejection and restore", () => {
    const f = productionCaptureFixture();
    const scope = unspentClaimFixture();
    f.ticks.currentTick = scope.decision.identity.tick;
    f.scene.events.emit(AI_DECISION_DISPATCH_EVENT, scope.decision);
    f.scene.events.emit(AI_INTENT_COMMAND_DISPATCH_EVENT, scope.request);
    f.outcomes.next(pendingCommandOutcome());
    f.scene.events.emit(AI_INTENT_COMMAND_DISPATCH_EVENT, scope.receipt);
    f.ticks.currentTick = 102;
    jest.mocked(isSnapshotApplyInProgress).mockReturnValue(true);
    f.outcomes.next({ ...pendingCommandOutcome("rejected"), reason: "invalid_owner" });
    const terminal = f.capture.capture(2).facts.at(-1);
    if (terminal?.kind !== "outcome") throw new Error("synthetic_terminal_missing");
    expect(terminal.tick).toBe(102);
    expect(terminal.scheduledTick).toBeNull();
    expect(requireAiTestEntry(terminal.boundaryStateBefore?.unspentClaims?.entries, 0).state).toBe("admitted");
    expect(requireAiTestEntry(terminal.boundaryState?.unspentClaims?.entries, 0).state).toBe("released");
    expect(terminal.boundaryStateBefore?.snapshotRestoreInProgress).toBe(true);
    expect(terminal.boundaryState?.unspentClaims?.resources?.food).toBe(0);
    f.capture.dispose();
  });
});
