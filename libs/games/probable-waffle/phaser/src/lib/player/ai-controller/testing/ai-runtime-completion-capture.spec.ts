import Phaser from "phaser";
import { ObjectNames, ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";
import { QueueItemType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getActorComponent } from "../../../data/actor-component";
import { isSnapshotApplyInProgress } from "../../../data/scene-data";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { observeQueueCompletionAuthority } from "../../../entity/components/queue/observe-queue-completion-authority";
import { QUEUE_COMPLETION_AUTHORITY_EVENT } from "../../../entity/components/queue/queue-completion-authority-event";
import { productionCaptureFixture, productionCaptureItem } from "./ai-runtime-production-capture-fixtures";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({ getPlayer: jest.fn(), isSnapshotApplyInProgress: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn(), getSceneSystem: jest.fn() }));

/** Synthetic service callbacks only; no live match, creation legality, strategic utility or executed proof. */
describe("AiRuntimeProductionCapture real completion callback projection", () => {
  it("keeps the removed item, actual created object/index registration and detached facts in callback order", () => {
    const f = productionCaptureFixture(); jest.mocked(isSnapshotApplyInProgress).mockReturnValue(false);
    const item = { ...productionCaptureItem(), remainingTime: 0, commandContext: {
      playerNumber: 2, actorIds: ["producer"], execution: { schemaVersion: 1 as const, source: "ai" as const,
        commandId: "purchase", commitmentKey: "purchase", sequence: 1, authorityEpoch: 1, intentId: "purchase", effectId: "purchase" }
    } };
    const created = {
      scene: f.scene, active: true, name: ObjectNames.TivaraWorkerMale
    } as unknown as Phaser.GameObjects.GameObject;
    const original = jest.mocked(getActorComponent).getMockImplementation();
    jest.mocked(getActorComponent).mockImplementation((actor, component) => {
      if (actor !== created) return original?.(actor, component);
      if (component === IdComponent) return { id: "created" } as never;
      if (component === OwnerComponent) return { getOwner: () => 2 } as never;
      return undefined;
    });
    observeQueueCompletionAuthority({ producer: f.actor, item }, () => {
      f.indexedActors.push(created); f.registered.next(created); return created;
    });
    const captured = f.capture.capture(2);
    expect(captured.facts.map((fact) => fact.kind)).toEqual(["queue_completion", "actor_registered", "queue_completion"]);
    const before = captured.facts[0]; const after = captured.facts[2];
    expect(before.kind === "queue_completion" && before.completion).toMatchObject({ phase: "before", createdActor: null,
      item: { itemId: "queue:producer:purchase", remainingTimeMs: 0 } });
    expect(after.kind === "queue_completion" && after.completion).toMatchObject({ phase: "after", createdActorInProducerScene: true,
      requestedCanonicalObjectName: ObjectNames.TivaraWorker,
      createdActor: { actorId: "created", objectName: ObjectNames.TivaraWorkerMale,
        canonicalObjectName: ObjectNames.TivaraWorker, playerNumber: 2, indexed: true, active: true, alive: true, finished: true } });
    item.remainingTime = 100; created.name = ObjectNames.TivaraWorkerFemale;
    expect(after.kind === "queue_completion" && after.completion.item?.remainingTimeMs).toBe(0);
    expect(after.kind === "queue_completion" && after.completion.createdActor?.objectName).toBe(ObjectNames.TivaraWorkerMale);
    expect(before.boundaryState?.queues).toEqual(after.boundaryState?.queues);
    f.scene.events.emit(Phaser.Scenes.Events.SHUTDOWN);
    expect(f.scene.events.listenerCount(QUEUE_COMPLETION_AUTHORITY_EVENT)).toBe(0);
    expect(f.registered.observed).toBe(false);
  });

  it("keeps actual new tech membership and its service event between exact before/after callbacks with restore status", () => {
    const f = productionCaptureFixture(); jest.mocked(isSnapshotApplyInProgress).mockReturnValue(true);
    const type = ResearchType.TivaraMacemanUpgradeLevel2;
    const item = { ...productionCaptureItem(), type: QueueItemType.Research, productionData: undefined, researchData: type,
      remainingTime: 0 };
    observeQueueCompletionAuthority({ producer: f.actor, item }, () => {
      f.completedResearch.add(type); f.researches.next({ playerNumber: 2, researchType: type }); return undefined;
    });
    const captured = f.capture.capture(2);
    expect(captured.facts.map((fact) => fact.kind)).toEqual(["queue_completion", "research_completed", "queue_completion"]);
    expect(captured.facts.filter((fact) => fact.kind === "queue_completion")
      .map((fact) => fact.completion.researchRegistered)).toEqual([false, true]);
    expect(captured.facts.every((fact) => fact.boundaryState?.snapshotRestoreInProgress === true)).toBe(true);
    expect(captured.facts.filter((fact) => fact.kind === "queue_completion")
      .every((fact) => fact.completion.snapshotRestoreInProgress)).toBe(true);
    f.capture.dispose(); expect(f.researches.observed).toBe(false);
  });

  it("teardown during authority work removes the after listener without adding a synthetic completed fact", () => {
    const f = productionCaptureFixture(); jest.mocked(isSnapshotApplyInProgress).mockReturnValue(false);
    const item = productionCaptureItem();
    observeQueueCompletionAuthority({ producer: f.actor, item }, () => { f.capture.dispose(); return undefined; });
    expect(f.scene.events.listenerCount(QUEUE_COMPLETION_AUTHORITY_EVENT)).toBe(0);
    expect(() => f.capture.capture(2)).toThrow("production_capture_disposed");
  });
});
