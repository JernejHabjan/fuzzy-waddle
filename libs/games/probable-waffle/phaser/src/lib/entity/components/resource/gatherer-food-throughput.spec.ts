import Phaser from "phaser";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { getActorComponent } from "../../../data/actor-component";
import { onObjectReady } from "../../../data/game-object-helper";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { fieldDefinition } from "../../../prefabs/buildings/shared/Field/field.definition";
import { GathererComponent } from "./gatherer-component";
import { ResourceSourceComponent } from "./resource-source-component";
import { TendableComponent } from "../tendable/tendable-component";
import { createDefaultGatherData } from "./create-default-gather-data";
import { PawnAiBlackboard } from "../../../prefabs/ai-agents/pawn-ai-blackboard";
import { PlayerPawnAiControllerAgent } from "../../../prefabs/ai-agents/player-pawn-ai-controller.agent";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({
  onObjectReady: jest.fn(),
  isSceneActive: () => true,
  getGameObjectVisibility: jest.fn(),
  getGameObjectRenderedTransform: jest.fn()
}));

/** Native source, cargo and simulation waits; the Field starts ripe to isolate collection from crop growth. */
function fixture() {
  const scene = new Phaser.Scene();
  const events = new Phaser.Events.EventEmitter();
  Object.assign(scene, {
    events,
    time: { timeScale: 1 },
    scene: { scene, isActive: () => true },
    sys: { isActive: () => true, queueDepthSort: () => undefined }
  });
  const ticks = new SimulationTickService(scene);
  jest
    .mocked(getSceneService)
    .mockImplementation((_scene, token) => (token === SimulationTickService ? ticks : undefined));
  jest.mocked(onObjectReady).mockImplementation((_actor, callback, context) => callback.call(context));
  const worker = new Phaser.GameObjects.GameObject(scene, "food-throughput-worker");
  const field = new Phaser.GameObjects.GameObject(scene, "food-throughput-field");
  const source = new ResourceSourceComponent(field, fieldDefinition.components.resourceSource);
  jest
    .mocked(getActorComponent)
    .mockImplementation((actor, token) => (actor === field && token === ResourceSourceComponent ? source : undefined));
  const gatherer = new GathererComponent(worker, { resourceSourceGameObjectClasses: [], resourceSweepRadius: 10 });
  jest.mocked(getActorComponent).mockImplementation((actor, token) => {
    if (actor === field && token === ResourceSourceComponent) return source;
    if (actor === worker && token === GathererComponent) return gatherer;
    return undefined;
  });
  expect(gatherer.startGatheringResources(field)).toBe(true);
  const advance = (count: number) => {
    for (let index = 0; index < count; index++) events.emit(Phaser.Scenes.Events.UPDATE, 0, 50);
  };
  return { scene, worker, field, source, gatherer, advance };
}

describe("shared food gathering throughput", () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([0, 5, 10])("recognizes actual restored cargo amount %s independently of pack capacity", (amount) => {
    const f = fixture();
    try {
      f.gatherer.setData({ carriedResourceAmount: amount, carriedResourceType: ResourceType.Food });
      const resources = new PlayerPawnAiControllerAgent(f.worker, new PawnAiBlackboard());
      expect(resources.HasCarriedResources()).toBe(amount > 0);
      expect(resources.GatherCapacityFull()).toBe(amount === 10);
      expect(f.gatherer.getData().carriedResourceAmount).toBe(amount);
    } finally {
      f.scene.events.emit(Phaser.Scenes.Events.SHUTDOWN);
      f.worker.destroy();
      f.field.destroy();
    }
  });

  it("fills a ten-food pack in two native harvests and retains cargo until drop-off", async () => {
    const f = fixture();
    try {
      const first = f.gatherer.gatherResources(f.field);
      f.advance(40);
      expect(await first).toBe(5);
      expect(f.gatherer.carriedResourceAmount).toBe(5);
      expect(f.gatherer.isCapacityFull()).toBe(false);
      f.advance(20);
      expect(f.gatherer.remainingCooldown).toBe(0);
      const second = f.gatherer.gatherResources(f.field);
      f.advance(40);
      expect(await second).toBe(5);
      expect(f.gatherer.carriedResourceAmount).toBe(10);
      expect(f.gatherer.isCapacityFull()).toBe(true);
      expect(f.gatherer.currentResourceSource).toBeNull();
      expect(f.source.getCurrentResources()).toBe(20);
    } finally {
      f.scene.events.emit(Phaser.Scenes.Events.SHUTDOWN);
      f.worker.destroy();
      f.field.destroy();
    }
  });

  it("finishes Field extraction after twenty simulation ticks with wall time frozen", async () => {
    const f = fixture();
    const wallTime = jest.spyOn(Date, "now").mockReturnValue(1000);
    try {
      let completed = false;
      const pending = f.source.extractResources(f.worker, 5).then((amount) => {
        completed = true;
        return amount;
      });
      f.advance(19);
      await Promise.resolve();
      expect(completed).toBe(false);
      f.advance(1);
      await Promise.resolve();
      await Promise.resolve();
      expect(completed).toBe(true);
      expect(await pending).toBe(5);
    } finally {
      wallTime.mockRestore();
      f.scene.events.emit(Phaser.Scenes.Events.SHUTDOWN);
      f.worker.destroy();
      f.field.destroy();
    }
  });

  it("regrows a depleted Field around fifteen simulated seconds of assigned tending", () => {
    const f = fixture();
    const crops = new TendableComponent(f.field, fieldDefinition.components.tendable);
    try {
      expect(crops.assignTender(f.worker)).toBe(true);
      expect(f.source.getCurrentResources()).toBe(0);
      f.advance(299);
      expect(crops.isReadyForHarvest()).toBe(false);
      expect(f.source.getCurrentResources()).toBe(0);
      // Floating-point accumulation may finish on the next 50 ms tick.
      f.advance(2);
      expect(crops.isReadyForHarvest()).toBe(true);
      expect(f.source.getCurrentResources()).toBe(30);
    } finally {
      f.scene.events.emit(Phaser.Scenes.Events.SHUTDOWN);
      f.worker.destroy();
      f.field.destroy();
    }
  });

  it("keeps non-food profiles unchanged and gives each component independent profiles", () => {
    const first = createDefaultGatherData();
    const second = createDefaultGatherData();
    for (const type of [ResourceType.Wood, ResourceType.Stone, ResourceType.Minerals]) {
      expect(first.find((entry) => entry.resourceType === type)).toEqual({
        resourceType: type,
        capacity: 3,
        amountPerGathering: 1,
        cooldown: 1000,
        range: 1,
        needsReturnToDrain: true
      });
    }
    expect(first).not.toBe(second);
    expect(first.find((entry) => entry.resourceType === ResourceType.Food)).not.toBe(
      second.find((entry) => entry.resourceType === ResourceType.Food)
    );
  });
});
