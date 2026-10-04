import { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { emitResource, getCommunicator, isSnapshotApplyInProgress } from "../../../data/scene-data";
import { emitQueueItemResource } from "../../../data/emit-queue-item-resource";
import { advanceSharedQueueItem } from "../../../entity/components/queue/advance-shared-queue-item";
import { QUEUE_PROGRESS_EVENT } from "../../../entity/components/queue/queue-progress-event";
import { AI_DECISION_DISPATCH_EVENT } from "../ai-decision-dispatch-event";
import { AI_INTENT_COMMAND_DISPATCH_EVENT } from "../ai-intent-command-dispatch-event";
import { pendingCommandOutcome } from "./ai-runtime-pending-command-fixtures";
import { unspentClaimFixture } from "./ai-runtime-unspent-claim-fixtures";
import { productionCaptureFixture as setup, productionCaptureItem as item } from "./ai-runtime-production-capture-fixtures";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({
  getPlayer: jest.fn(), getCommunicator: jest.fn(), emitResource: jest.fn(), isSnapshotApplyInProgress: jest.fn()
}));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn(), getSceneSystem: jest.fn() }));

describe("production callback authority", () => {
  it("captures the real post-progress hook, including the final charge before removal and an unprocessed zero head", () => {
    const f = setup();
    jest.mocked(getCommunicator).mockReturnValue(f.scene.communicator as never);
    jest.mocked(isSnapshotApplyInProgress).mockReturnValue(false);
    jest.mocked(emitResource).mockImplementation((_scene, action, amounts) => {
      for (const type of Object.values(ResourceType)) f.money[type] +=
        (action === "resource.added" ? 1 : -1) * (amounts[type] ?? 0);
      f.changes.next({ property: action, data: { playerNumber: 2, playerStateData: { resources: amounts } } });
    });
    const advance = () => advanceSharedQueueItem(f.actor, f.queuedItems[0], 50, () => {
      emitQueueItemResource({ producer: f.actor, item: f.queuedItems[0], operation: "tick_charge",
        amounts: { food: 7 }, playerNumber: 2 });
      return true;
    });
    advance();
    const capture = f.capture.capture(2);
    const payment = capture.facts.find((fact) => fact.kind === "queue_resource" && fact.resource.emission.phase === "finished");
    const progressed = capture.facts.at(-1);
    expect(payment?.boundaryState?.resources?.food).toBe(93);
    expect(payment?.boundaryState?.obligations?.food).toBe(28);
    expect(payment?.boundaryState?.queues?.[0].lanes[0].items[0].remainingTimeMs).toBe(100);
    expect(progressed?.kind === "queue_progress" && progressed.progress).toMatchObject({ phase: "advanced",
      remainingBeforeMs: 100, deltaMs: 50, item: { remainingTimeMs: 50 } });
    expect(progressed?.boundaryState?.obligations?.food).toBe(21);
    advance();
    const exhausted = f.capture.capture(2).facts.at(-1);
    const exhaustedId = exhausted?.kind === "queue_progress" ? exhausted.progress.item?.itemId : undefined;
    expect(exhausted?.boundaryState?.exhaustedProgressItemId).toBe(exhaustedId);
    expect(exhausted?.boundaryState?.obligations?.food).toBe(14);
    expect(f.queuedItems).toHaveLength(2);
    // The next unprocessed zero head still enters the real payment branch once.
    f.queuedItems.shift(); f.queuedItems[0].remainingTime = 0;
    advance();
    const final = f.capture.capture(2).facts.at(-1);
    expect(final?.boundaryState?.obligations?.food).toBe(0);
    expect(final?.boundaryState?.resources?.food).toBe(79);
    expect(progressed?.boundaryState?.queues?.[0].lanes[0].items[0].remainingTimeMs).toBe(50);
    f.capture.dispose();
    expect(f.scene.events.listenerCount(QUEUE_PROGRESS_EVENT)).toBe(0);
  });

  it("uses the selected lease during synchronous payment even while saved state and pending claims lag", () => {
    const f = setup(); const selected = unspentClaimFixture();
    f.ticks.currentTick = 100;
    jest.mocked(getCommunicator).mockReturnValue(f.scene.communicator as never);
    jest.mocked(isSnapshotApplyInProgress).mockReturnValue(false);
    jest.mocked(emitResource).mockImplementation((_scene, action, amounts) => {
      f.money.food -= amounts.food ?? 0;
      f.changes.next({ property: action, data: { playerNumber: 2, playerStateData: { resources: amounts } } });
    });
    f.scene.events.emit(AI_DECISION_DISPATCH_EVENT, selected.decision);
    f.scene.events.emit(AI_INTENT_COMMAND_DISPATCH_EVENT, selected.request);
    f.outcomes.next(pendingCommandOutcome());
    const purchased = { ...item(), totalTime: 150, remainingTime: 150,
      productionData: { ...item().productionData, actorName: ObjectNames.TivaraWorker,
        costData: { costType: PaymentType.PayImmediately, productionTime: 150, refundFactor: 1, resources: { food: 35 } } },
      commandContext: selected.resource.originatingCommandContext } satisfies UnifiedQueueItem;
    emitQueueItemResource({ producer: f.actor, item: purchased, operation: "immediate_charge", amounts: { food: 35 }, playerNumber: 2 });
    const captured = f.capture.capture(2);
    const finish = captured.facts.at(-1);
    expect(captured.facts[0].boundaryState?.unspentClaims?.resources?.food).toBe(35);
    expect(finish?.boundaryState?.brain?.reservations).toEqual([]);
    expect(finish?.boundaryState?.pendingResourceClaims?.food).toBe(35);
    expect(finish?.boundaryState?.unspentClaims?.resources?.food).toBe(0);
    expect(finish?.boundaryState?.gaps).not.toContain("production_boundary_unspent_reconciliation_missing");
    f.capture.dispose();
  });

});
