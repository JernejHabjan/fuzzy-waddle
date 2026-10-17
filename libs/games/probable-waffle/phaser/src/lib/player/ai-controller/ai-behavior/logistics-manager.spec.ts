import type Phaser from "phaser";
import { State } from "mistreevous";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { getActorComponent } from "../../../data/actor-component";
import { GathererComponent } from "../../../entity/components/resource/gatherer-component";
import type { PlayerAiBlackboard } from "../player-ai-blackboard";
import { LogisticsManager } from "./logistics-manager";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));

function fixture() {
  let activeScene = true;
  const worker = { active: true, scene: { sys: { isActive: () => activeScene } } } as Phaser.GameObjects.GameObject;
  const source = { name: "Tree6" } as Phaser.GameObjects.GameObject;
  const selected = { name: "Stone" } as Phaser.GameObjects.GameObject;
  let carrying = false;
  const gatherer = {
    isGathering: true,
    currentResourceSource: source,
    isCarryingResources: () => carrying,
    getClosestResourceSource: jest.fn(async () => selected),
    startGatheringResources: jest.fn(() => true)
  };
  const log = jest.fn();
  const board = { workers: [worker], getNow: () => 10000 } as unknown as PlayerAiBlackboard;
  const manager = new LogisticsManager(board, log);
  jest.spyOn(manager, "getMostConstrainedResource").mockReturnValue(ResourceType.Stone);
  jest
    .mocked(getActorComponent)
    .mockImplementation((_actor, token) => (token === GathererComponent ? (gatherer as never) : undefined));
  return {
    manager,
    gatherer,
    worker,
    selected,
    log,
    deactivateScene: () => {
      activeScene = false;
    },
    setCargo: () => {
      carrying = true;
    }
  };
}

describe("logistics admits only actual unloaded source reassignments", () => {
  beforeEach(() => jest.resetAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it("does not claim success or start cooldown when native admission refuses", async () => {
    const f = fixture();
    f.gatherer.startGatheringResources.mockReturnValue(false);
    expect(await f.manager.redirectToScarce()).toBe(State.FAILED);
    f.gatherer.startGatheringResources.mockReturnValue(true);
    expect(await f.manager.rebalanceHarvesters()).toBe(State.SUCCEEDED);
    expect(f.gatherer.startGatheringResources).toHaveBeenCalledTimes(2);
    expect(await f.manager.rebalanceHarvesters()).toBe(State.FAILED);
  });

  it("leaves a loaded worker under delivery ownership", async () => {
    const f = fixture();
    f.setCargo();
    expect(await f.manager.redirectToScarce()).toBe(State.FAILED);
    expect(f.gatherer.getClosestResourceSource).not.toHaveBeenCalled();
    expect(f.gatherer.startGatheringResources).not.toHaveBeenCalled();
  });

  it.each(["cargo", "assignment", "stopped", "inactive", "scene"] as const)(
    "discards stale source selection after %s changes",
    async (boundary) => {
      const f = fixture();
      let release!: (value: Phaser.GameObjects.GameObject) => void;
      f.gatherer.getClosestResourceSource.mockImplementation(
        () =>
          new Promise((resolve) => {
            release = resolve;
          })
      );
      const pending = f.manager.redirectToScarce();
      if (boundary === "cargo") f.setCargo();
      if (boundary === "assignment") f.gatherer.currentResourceSource = f.selected;
      if (boundary === "stopped") f.gatherer.isGathering = false;
      if (boundary === "inactive") f.worker.active = false;
      if (boundary === "scene") f.deactivateScene();
      release(f.selected);
      expect(await pending).toBe(State.FAILED);
      expect(f.gatherer.startGatheringResources).not.toHaveBeenCalled();
    }
  );
});
