import Phaser from "phaser";
import { ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";
import {
  QueueItemType,
  type UnifiedQueueItem
} from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { getActorComponent } from "../../../data/actor-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { onObjectReady } from "../../../data/game-object-helper";
import { emitQueueItemResource } from "../../../data/emit-queue-item-resource";
import { OwnerComponent } from "../owner-component";
import { QueueComponent } from "../queue/queue-component";
import { ResearchComponent } from "./research-component";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({ onObjectReady: jest.fn() }));
jest.mock("../../../data/emit-queue-item-resource", () => ({ emitQueueItemResource: jest.fn() }));

function fixture() {
  jest.clearAllMocks();
  const queue = { registerResearchComponent: jest.fn(), replaceLegacyItems: jest.fn() };
  const complete = jest.fn();
  let researched = false;
  jest.spyOn(QueueComponent, "createSharedQueue").mockReturnValue(queue as never);
  jest
    .mocked(getActorComponent)
    .mockImplementation((_actor, component) =>
      component === OwnerComponent
        ? ({ getOwner: () => 1 } as never)
        : component === QueueComponent
          ? (queue as never)
          : undefined
    );
  jest
    .mocked(getSceneService)
    .mockReturnValue({ isResearched: () => researched, registerResearchComplete: complete } as never);
  jest.mocked(onObjectReady).mockImplementation((_actor, callback, scope) => callback.call(scope));
  const actor = { scene: {}, emit: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
  const research = new ResearchComponent(actor, { availableResearch: [ResearchType.SnowstormSpell] });
  return {
    research,
    queue,
    actor,
    complete,
    markResearched: () => {
      researched = true;
    }
  };
}

afterEach(() => jest.restoreAllMocks());

describe("research continuation ownership", () => {
  it("restores legacy zero-time research without payment and replaces an explicitly empty list", () => {
    const f = fixture();
    f.research.setData({ researches: [{ type: ResearchType.SnowstormSpell, remainingTime: 0 }] });
    expect(f.queue.replaceLegacyItems).toHaveBeenLastCalledWith(QueueItemType.Research, [
      expect.objectContaining({ remainingTime: 0, researchData: ResearchType.SnowstormSpell })
    ]);
    f.research.setData({ researches: [] });
    expect(f.queue.replaceLegacyItems).toHaveBeenLastCalledWith(QueueItemType.Research, []);
    expect(emitQueueItemResource).not.toHaveBeenCalled();
  });

  it("registers research and emits its completion once through synchronous reentry and a repeated restored callback", () => {
    const f = fixture();
    f.complete.mockImplementation(() => {
      f.research.handleResearchComplete(ResearchType.SnowstormSpell);
      f.markResearched();
    });
    f.research.handleResearchComplete(ResearchType.SnowstormSpell);
    f.research.handleResearchComplete(ResearchType.SnowstormSpell);
    expect(f.complete).toHaveBeenCalledTimes(1);
    expect(f.actor.emit).toHaveBeenCalledTimes(1);
  });

  it("refunds the saved paid research policy instead of a subsequently rebalanced definition", () => {
    const f = fixture();
    const item: UnifiedQueueItem = {
      type: QueueItemType.Research,
      researchData: ResearchType.SnowstormSpell,
      totalTime: 100,
      remainingTime: 50,
      researchCost: { resources: { wood: 40 }, refundFactor: 0.5 }
    };
    f.research.handleResearchRefund(ResearchType.SnowstormSpell, 50, 100, item);
    expect(emitQueueItemResource).toHaveBeenCalledWith(
      expect.objectContaining({
        item,
        operation: "cancellation_refund",
        amounts: { wood: 10 }
      })
    );
  });
});
