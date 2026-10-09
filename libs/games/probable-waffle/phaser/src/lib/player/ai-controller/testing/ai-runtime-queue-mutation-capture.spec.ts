import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import Phaser from "phaser";
import { isSnapshotApplyInProgress } from "../../../data/scene-data";
import { mutateSharedQueueItem } from "../../../entity/components/queue/mutate-shared-queue-item";
import { QUEUE_MUTATION_EVENT } from "../../../entity/components/queue/queue-mutation-event";
import { productionCaptureFixture, productionCaptureItem } from "./ai-runtime-production-capture-fixtures";
jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({ getPlayer: jest.fn(), isSnapshotApplyInProgress: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({
  getSceneService: jest.fn(),
  getSceneSystem: jest.fn()
}));
describe("AiRuntimeProductionCapture physical mutation callbacks", () => {
  it("retains the outside-lane item and exact physical boundaries without a UI notification", () => {
    const f = productionCaptureFixture();
    jest.mocked(isSnapshotApplyInProgress).mockReturnValue(false);
    const item = {
      ...productionCaptureItem(),
      commandContext: {
        playerNumber: 2,
        actorIds: ["producer"],
        execution: {
          schemaVersion: 1 as const,
          commandId: "new-purchase",
          commitmentKey: "new-purchase",
          source: "ai" as const,
          sequence: 1,
          authorityEpoch: 1,
          intentId: "purchase",
          effectId: "purchase"
        }
      }
    };
    const scope = { producer: f.actor, item, queueIndex: 0, itemIndex: 2, operation: "enqueue" as const };
    mutateSharedQueueItem(scope, () => {
      f.queuedItems.push(item);
    });
    const captured = f.capture.capture(2);
    expect(captured.facts.map((fact) => fact.kind)).toEqual(["queue_mutation", "queue_mutation"]);
    expect(
      requireAiTestEntry(requireAiTestEntry(requireAiTestEntry(captured.facts, 0).boundaryState?.queues, 0).lanes, 0)
        .items
    ).toHaveLength(2);
    expect(
      requireAiTestEntry(requireAiTestEntry(requireAiTestEntry(captured.facts, 1).boundaryState?.queues, 0).lanes, 0)
        .items
    ).toHaveLength(3);
    const before = requireAiTestEntry(captured.facts, 0);
    expect(before.kind === "queue_mutation" && before.mutation).toMatchObject({
      phase: "before",
      item: { itemId: "queue:producer:new-purchase", commandId: "new-purchase", remainingTimeMs: 100 }
    });
    item.remainingTime = 50;
    expect(before.kind === "queue_mutation" && before.mutation.item?.remainingTimeMs).toBe(100);
    expect(requireAiTestEntry(captured.facts, 0).boundaryState?.resources).toEqual(
      requireAiTestEntry(captured.facts, 1).boundaryState?.resources
    );
    f.scene.events.emit(Phaser.Scenes.Events.SHUTDOWN);
    expect(f.scene.events.listenerCount(QUEUE_MUTATION_EVENT)).toBe(0);
  });
  it("samples actual consumed-head removal liabilities and retains restore state", () => {
    const f = productionCaptureFixture();
    jest.mocked(isSnapshotApplyInProgress).mockReturnValue(true);
    const item = requireAiTestEntry(f.queuedItems, 0);
    item.remainingTime = 0;
    mutateSharedQueueItem(
      { producer: f.actor, item, queueIndex: 0, itemIndex: 0, operation: "complete_remove" },
      () => {
        f.queuedItems.splice(0, 1);
      }
    );
    const captured = f.capture.capture(2);
    expect(requireAiTestEntry(captured.facts, 0).boundaryState?.exhaustedProgressItemId).toBeDefined();
    expect(requireAiTestEntry(captured.facts, 0).boundaryState?.obligations?.food).toBe(14);
    expect(requireAiTestEntry(captured.facts, 1).boundaryState?.obligations?.food).toBe(14);
    expect(requireAiTestEntry(captured.facts, 1).boundaryState?.exhaustedProgressItemId).toBeUndefined();
    const before = requireAiTestEntry(captured.facts, 0);
    expect(before.kind === "queue_mutation" && before.mutation.snapshotRestoreInProgress).toBe(true);
    f.capture.dispose();
  });
  it("keeps the distinct applied cancellation detached from the original removed live handle", () => {
    const f = productionCaptureFixture();
    jest.mocked(isSnapshotApplyInProgress).mockReturnValue(false);
    const item = requireAiTestEntry(f.queuedItems, 0);
    const cancellationCommand = {
      type: "CANCEL_PRODUCTION" as const,
      tick: 0,
      playerNumber: 2,
      actorIds: ["producer"],
      queueIndex: 0
    };
    mutateSharedQueueItem(
      { producer: f.actor, item, queueIndex: 0, itemIndex: 0, operation: "cancel_remove", cancellationCommand },
      () => {
        f.queuedItems.splice(0, 1);
      }
    );
    const captured = f.capture.capture(2);
    const before = requireAiTestEntry(captured.facts, 0);
    const after = requireAiTestEntry(captured.facts, 1);
    expect(before.kind === "queue_mutation" && before.mutation.cancellationCommand).toEqual(cancellationCommand);
    expect(after.kind === "queue_mutation" && after.mutation.item?.itemId).toBe(
      before.kind === "queue_mutation" ? before.mutation.item?.itemId : null
    );
    cancellationCommand.actorIds.push("foreign");
    expect(before.kind === "queue_mutation" && before.mutation.cancellationCommand?.actorIds).toEqual(["producer"]);
    f.capture.dispose();
  });
});
