import Phaser from "phaser";
import type { UnifiedQueueItem } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { subscribeSceneResourceLoss } from "../../../data/scene-resource-observation";
import { QueueComponent } from "./queue-component";

jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));

describe("queue resource history boundary (authored; final gate pending)", () => {
  beforeEach(() => { jest.clearAllMocks(); jest.mocked(getSceneService).mockReturnValue(undefined); });

  it("fences queue restore before clearing and clones lane placement without aliasing saved items", () => {
    const scene = { events: new Phaser.Events.EventEmitter() };
    const producer = { scene, once: jest.fn(), emit: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
    const queue = new QueueComponent(producer, { queueCount: 2, capacityPerQueue: 2 });
    const original = { type: "production", totalTime: 100, remainingTime: 40 } as unknown as UnifiedQueueItem;
    queue.addItem(original);
    const before = queue.getData();
    const replacement = { ...original, remainingTime: 25 } as UnifiedQueueItem;
    const losses: string[] = [], release = subscribeSceneResourceLoss(scene as unknown as Phaser.Scene, (reason) => {
      losses.push(reason);
      expect(queue.length).toBe(1);
    });
    queue.setData([replacement]);
    const after = queue.getData();
    expect(losses).toEqual(["resource_queue_restore"]);
    expect(after).toEqual([replacement]);
    expect(after[0]).not.toBe(replacement);
    expect(before[0]).not.toBe(after[0]);
    replacement.remainingTime = 1;
    expect(queue.getData()[0]?.remainingTime).toBe(25);
    release();
  });

  it("fences an empty matching restore before clearing prior queued items", () => {
    const scene = { events: new Phaser.Events.EventEmitter() };
    const producer = { scene, once: jest.fn(), emit: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
    const queue = new QueueComponent(producer, { queueCount: 1, capacityPerQueue: 2 });
    queue.addItem({ type: "production", totalTime: 10, remainingTime: 10 } as unknown as UnifiedQueueItem);
    const losses: string[] = [], release = subscribeSceneResourceLoss(scene as unknown as Phaser.Scene, (reason) => {
      losses.push(reason);
      expect(queue.length).toBe(1);
    });
    queue.setData([]);
    expect(losses).toEqual(["resource_queue_restore"]);
    expect(queue.length).toBe(0);
    release();
  });
});
