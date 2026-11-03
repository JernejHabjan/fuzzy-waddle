import Phaser from "phaser";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { getActorComponent } from "../../../data/actor-component";
import { GathererComponent } from "./gatherer-component";
import { ResourceSourceComponent } from "./resource-source-component";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({ onObjectReady: jest.fn() }));

/** Real source assignment and cargo state, with no pathfinding or credited income claim. */
function fixture() {
  const scene = new Phaser.Scene();
  Object.assign(scene, {
    events: new Phaser.Events.EventEmitter(),
    sys: { queueDepthSort: () => undefined }
  });
  const worker = new Phaser.GameObjects.GameObject(scene, "worker");
  const original = new Phaser.GameObjects.GameObject(scene, "original");
  const replacement = new Phaser.GameObjects.GameObject(scene, "replacement");
  const foreign = new Phaser.GameObjects.GameObject(scene, "foreign");
  const sources = new Map([
    [
      original,
      new ResourceSourceComponent(original, {
        resourceType: ResourceType.Wood,
        maximumResources: 100,
        gatheringFactor: 1,
        cooldown: 1000
      })
    ],
    [
      replacement,
      new ResourceSourceComponent(replacement, {
        resourceType: ResourceType.Wood,
        maximumResources: 100,
        gatheringFactor: 1,
        cooldown: 1000
      })
    ],
    [
      foreign,
      new ResourceSourceComponent(foreign, {
        resourceType: ResourceType.Stone,
        maximumResources: 100,
        gatheringFactor: 1,
        cooldown: 1000
      })
    ]
  ]);
  jest
    .mocked(getActorComponent)
    .mockImplementation((actor, token) => (token === ResourceSourceComponent ? sources.get(actor) : undefined));
  const gatherer = new GathererComponent(worker, { resourceSourceGameObjectClasses: [], resourceSweepRadius: 10 });
  expect(gatherer.startGatheringResources(original)).toBe(true);
  gatherer.carriedResourceAmount = 1;
  return { gatherer, original, replacement, foreign };
}

describe("native source switching with cargo", () => {
  beforeEach(() => jest.resetAllMocks());

  it("preserves a partial pack when switching to another source of the same resource", () => {
    const f = fixture();
    expect(f.gatherer.startGatheringResources(f.replacement)).toBe(true);
    expect(f.gatherer.carriedResourceAmount).toBe(1);
    expect(f.gatherer.carriedResourceType).toBe(ResourceType.Wood);
    expect(f.gatherer.currentResourceSource).toBe(f.replacement);
  });

  it("rejects a different resource before changing assignment or cargo", () => {
    const f = fixture();
    expect(f.gatherer.startGatheringResources(f.foreign)).toBe(false);
    expect(f.gatherer.carriedResourceAmount).toBe(1);
    expect(f.gatherer.carriedResourceType).toBe(ResourceType.Wood);
    expect(f.gatherer.currentResourceSource).toBe(f.original);
    expect(f.gatherer.startGatheringResources(f.original)).toBe(true);
  });

  it("allows a different resource after delivery empties the pack", () => {
    const f = fixture();
    f.gatherer.carriedResourceAmount = 0;
    expect(f.gatherer.startGatheringResources(f.foreign)).toBe(true);
    expect(f.gatherer.carriedResourceAmount).toBe(0);
    expect(f.gatherer.carriedResourceType).toBe(ResourceType.Stone);
  });
});
