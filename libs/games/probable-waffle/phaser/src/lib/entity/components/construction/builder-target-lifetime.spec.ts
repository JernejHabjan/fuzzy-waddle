import Phaser from "phaser";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectLogicalTransform } from "../../../data/game-object-helper";
import { DistanceHelper } from "../../../library/distance-helper";
import { OwnerComponent } from "../owner-component";
import { ConstructionSiteComponent } from "./construction-site-component";
import { BuilderComponent } from "./builder-component";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({ onObjectReady: jest.fn(), getGameObjectLogicalTransform: jest.fn() }));
jest.mock("../../../library/distance-helper", () => ({ DistanceHelper: {
  distance3D: () => 1, batchGetDistancesBetweenGameObjects: jest.fn()
} }));

describe("automatic construction job selection", () => {
  beforeEach(() => jest.resetAllMocks());

  it.each(["cancelled", "finished", "full", "captured", "destroyed", "unchanged"] as const)(
    "rechecks %s sites after asynchronous pathfinding before selecting useful work",
    async (boundary) => {
      const scene = new Phaser.Scene();
      Object.assign(scene, { sys: { queueDepthSort: jest.fn() }, events: new Phaser.Events.EventEmitter() });
      const worker = new Phaser.GameObjects.GameObject(scene, "worker");
      const site = new Phaser.GameObjects.GameObject(scene, "site");
      Object.assign(scene, { children: { list: [site] } });
      let available = true, siteOwner = 1;
      jest.mocked(getActorComponent).mockImplementation((actor, token) => {
        if (token === OwnerComponent) return { getOwner: () => actor === worker ? 1 : siteOwner } as never;
        if (token === ConstructionSiteComponent) return { canAssignBuilder: () => available } as never;
        return undefined;
      });
      jest.mocked(getGameObjectLogicalTransform).mockReturnValue({ x: 0, y: 0, z: 0 } as never);
      let finish: ((distances: number[]) => void) | undefined;
      jest.mocked(DistanceHelper.batchGetDistancesBetweenGameObjects).mockImplementation(() => new Promise((resolve) => {
        finish = resolve;
      }));
      const builder = new BuilderComponent(worker, {
        enterConstructionSite: false, constructionSiteOffset: 1, constructableBuildings: {}
      });
      const pending = builder.getClosestConstructionSite(10);
      if (["cancelled", "finished", "full"].includes(boundary)) available = false;
      if (boundary === "captured") siteOwner = 2;
      if (boundary === "destroyed") site.destroy();
      if (!finish) throw new Error("path_lookup_not_started");
      finish([1]);
      expect(await pending).toBe(boundary === "unchanged" ? site : null);
    }
  );
});
