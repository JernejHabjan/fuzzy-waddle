import Phaser from "phaser";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { getActorComponent } from "../../../data/actor-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { DistanceHelper } from "../../../library/distance-helper";
import { OwnerComponent } from "../owner-component";
import { HealthComponent } from "../combat/components/health-component";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { GathererTargetSelection } from "./gatherer-target-selection";
import type { GathererComponent } from "./gatherer-component";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../../library/distance-helper", () => ({ DistanceHelper: { batchGetDistancesBetweenGameObjects: jest.fn() } }));

describe("drop-off selection across asynchronous path lookup", () => {
  beforeEach(() => jest.resetAllMocks());

  it.each(["destroyed", "killed", "captured", "carrier_lost", "cargo_changed", "unchanged"] as const)(
    "discards a stale candidate after %s instead of assigning another invalid return job",
    async (boundary) => {
      const scene = new Phaser.Scene();
      Object.assign(scene, { sys: { queueDepthSort: jest.fn(), isActive: () => true } });
      const worker = new Phaser.GameObjects.GameObject(scene, "worker");
      const drain = new Phaser.GameObjects.GameObject(scene, "drain");
      let friendly = true, alive = true;
      jest.mocked(getActorComponent).mockImplementation((_actor, token) => {
        if (token === OwnerComponent) return { isSameTeamAsGameObject: () => friendly } as never;
        if (token === HealthComponent) return { get alive() { return alive; } } as never;
        return undefined;
      });
      jest.mocked(getSceneService).mockReturnValue({ getResourceDrainsFiltered: () => [drain] } as never);
      let finish: ((distances: number[]) => void) | undefined;
      jest.mocked(DistanceHelper.batchGetDistancesBetweenGameObjects).mockImplementation(() => new Promise((resolve) => {
        finish = resolve;
      }));
      const state = { carriedResourceType: ResourceType.Wood } as GathererComponent;
      const targets = new GathererTargetSelection(worker, state);
      const pending = targets.findClosestResourceDrain();
      if (boundary === "destroyed") drain.destroy();
      if (boundary === "killed") alive = false;
      if (boundary === "captured") friendly = false;
      if (boundary === "carrier_lost") worker.destroy();
      if (boundary === "cargo_changed") state.carriedResourceType = ResourceType.Stone;
      if (!finish) throw new Error("path_lookup_not_started");
      finish([1]);
      expect(await pending).toBe(boundary === "unchanged" ? drain : null);
    }
  );

  it("breaks equal-distance drop-off ties by geometry before run-local actor IDs", async () => {
    const scene = new Phaser.Scene();
    Object.assign(scene, { sys: { queueDepthSort: jest.fn(), isActive: () => true } });
    const worker = new Phaser.GameObjects.GameObject(scene, "worker");
    const east = Object.assign(new Phaser.GameObjects.GameObject(scene, "east-drain"), {
      hasTransformComponent: true,
      x: 12,
      y: 4,
      z: 0
    });
    const west = Object.assign(new Phaser.GameObjects.GameObject(scene, "west-drain"), {
      hasTransformComponent: true,
      x: 4,
      y: 4,
      z: 0
    });
    const ids = new Map([
      [east, { id: "a-east" }],
      [west, { id: "z-west" }]
    ]);
    jest.mocked(getActorComponent).mockImplementation((_actor, token) => {
      if (token === OwnerComponent) return { isSameTeamAsGameObject: () => true } as never;
      if (token === IdComponent) return ids.get(_actor as typeof east) as never;
      return undefined;
    });
    jest.mocked(DistanceHelper.batchGetDistancesBetweenGameObjects).mockResolvedValue([8, 8]);
    const drains = [east, west];
    jest.mocked(getSceneService).mockImplementation(() => ({ getResourceDrainsFiltered: () => drains } as never));
    const state = { carriedResourceType: ResourceType.Wood } as GathererComponent;

    expect(await new GathererTargetSelection(worker, state).findClosestResourceDrain()).toBe(west);
    drains.reverse();
    expect(await new GathererTargetSelection(worker, state).findClosestResourceDrain()).toBe(west);
  });
});
