import type Phaser from "phaser";
import { ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";
import { getActorComponent } from "../../../data/actor-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { getPlayer } from "../../../data/scene-data";
import { onObjectReady } from "../../../data/game-object-helper";
import { emitQueueItemResource } from "../../../data/emit-queue-item-resource";
import { OwnerComponent } from "../owner-component";
import { ConstructionSiteComponent } from "../construction/construction-site-component";
import { QueueComponent } from "../queue/queue-component";
import { ResearchComponent } from "./research-component";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../../data/scene-data", () => ({ getPlayer: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({ onObjectReady: jest.fn() }));
jest.mock("../../../data/emit-queue-item-resource", () => ({ emitQueueItemResource: jest.fn() }));
jest.mock("./has-pending-player-research", () => ({ hasPendingPlayerResearch: () => false }));

it("refuses unfinished, missing and full queues before charging research, then admits ready paid work", () => {
  let finished = false,
    present = true,
    room = true;
  const queue = {
    registerResearchComponent: jest.fn(),
    addItem: jest.fn(),
    findQueueForNewItem: () => (room ? {} : undefined)
  };
  jest.spyOn(QueueComponent, "createSharedQueue").mockReturnValue(queue as never);
  jest
    .mocked(getActorComponent)
    .mockImplementation(
      (_actor, component) =>
        (component === OwnerComponent
          ? { getOwner: () => 2 }
          : component === ConstructionSiteComponent
            ? { isFinished: finished }
            : component === QueueComponent && present
              ? queue
              : undefined) as never
    );
  jest.mocked(getSceneService).mockReturnValue({ isResearched: () => false, isContentAllowed: () => true } as never);
  jest.mocked(getPlayer).mockReturnValue({ canPayAllResources: () => true } as never);
  jest.mocked(onObjectReady).mockImplementation((_actor, callback, scope) => callback.call(scope));
  const research = new ResearchComponent(
    { scene: {} as Phaser.Scene, emit: jest.fn() } as unknown as Phaser.GameObjects.GameObject,
    { availableResearch: [ResearchType.TivaraMacemanUpgradeLevel2] }
  );
  const attempt = () => research.startResearch(ResearchType.TivaraMacemanUpgradeLevel2);
  expect(attempt()).toBe(false);
  finished = true;
  present = false;
  expect(attempt()).toBe(false);
  present = true;
  room = false;
  expect(attempt()).toBe(false);
  expect(emitQueueItemResource).not.toHaveBeenCalled();
  expect(queue.addItem).not.toHaveBeenCalled();
  room = true;
  expect(attempt()).toBe(true);
  expect(emitQueueItemResource).toHaveBeenCalledTimes(1);
  expect(queue.addItem).toHaveBeenCalledTimes(1);
});
