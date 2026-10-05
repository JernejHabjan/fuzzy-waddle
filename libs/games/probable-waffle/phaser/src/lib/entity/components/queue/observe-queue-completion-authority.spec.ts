import Phaser from "phaser";
import { ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";
import { QueueItemType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { getActorComponent } from "../../../data/actor-component";
import { OwnerComponent } from "../owner-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { productionCaptureItem } from "../../../player/ai-controller/testing/ai-runtime-production-capture-fixtures";
import { QUEUE_COMPLETION_AUTHORITY_EVENT, type QueueCompletionAuthorityEvent } from "./queue-completion-authority-event";
import { observeQueueCompletionAuthority } from "./observe-queue-completion-authority";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));

/** Synthetic callback contracts; actual spawning/tech correctness and Phaser mock compatibility are unrun. */
describe("shared queue completion authority observation", () => {
  it("calls once and returns the exact created object before later terminal work, with scene-local identities", () => {
    const scene = { events: new Phaser.Events.EventEmitter() };
    const producer = { scene } as unknown as Phaser.GameObjects.GameObject;
    const created = { scene, name: "created" } as unknown as Phaser.GameObjects.GameObject;
    const scope = { producer, item: productionCaptureItem() };
    const events: QueueCompletionAuthorityEvent[] = [];
    const log: string[] = [];
    scene.events.on(QUEUE_COMPLETION_AUTHORITY_EVENT, (event: QueueCompletionAuthorityEvent) => {
      log.push(event.phase); events.push(event);
    });
    const create = jest.fn(() => { log.push("actual-creator"); return created; });
    expect(observeQueueCompletionAuthority(scope, create)).toBe(created);
    log.push("terminal");
    expect(create).toHaveBeenCalledTimes(1);
    expect(log).toEqual(["before", "actual-creator", "after", "terminal"]);
    expect(events[0].item).toBe(scope.item); expect(events[1].createdActor).toBe(created);
    expect(events[0].createdActor).toBeNull(); expect(events[1].completionId).toBe(events[0].completionId);
    const first = events[0].completionId;
    observeQueueCompletionAuthority(scope, () => undefined);
    expect(events[2].completionId).toBe(first + 1); expect(events[3].createdActor).toBeNull();
  });

  it("samples actual tech membership before/after its call and propagates a throw without a successful after", () => {
    let researched = false;
    jest.mocked(getActorComponent).mockImplementation((_actor, component) => component === OwnerComponent ?
      { getOwner: () => 1 } as never : undefined);
    jest.mocked(getSceneService).mockReturnValue({ isResearched: () => researched } as never);
    const producer = { scene: { events: new Phaser.Events.EventEmitter() } } as unknown as Phaser.GameObjects.GameObject;
    const scope = { producer, item: { ...productionCaptureItem(), type: QueueItemType.Research,
      productionData: undefined, researchData: ResearchType.TivaraMacemanUpgradeLevel2 } };
    const events: QueueCompletionAuthorityEvent[] = [];
    producer.scene.events.on(QUEUE_COMPLETION_AUTHORITY_EVENT, (event: QueueCompletionAuthorityEvent) => events.push(event));
    observeQueueCompletionAuthority(scope, () => { researched = true; return undefined; });
    expect(events.map((event) => event.researchRegistered)).toEqual([false, true]);
    expect(() => observeQueueCompletionAuthority(scope, () => { throw new Error("actual-authority"); })).toThrow("actual-authority");
    expect(events.slice(-2).map((event) => event.phase)).toEqual(["before", "threw"]);
    producer.scene.events.removeAllListeners(QUEUE_COMPLETION_AUTHORITY_EVENT);
    const register = jest.fn(() => undefined);
    observeQueueCompletionAuthority(scope, register); expect(register).toHaveBeenCalledTimes(1);
  });
});
