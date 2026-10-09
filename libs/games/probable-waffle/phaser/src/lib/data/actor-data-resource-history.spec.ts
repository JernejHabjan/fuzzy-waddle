import type Phaser from "phaser";
import { addActorComponent, ActorData, ActorDataKey, removeActorComponent, setFullActorDataFromName } from "./actor-data";
import { subscribeSceneResourceLoss } from "./scene-resource-observation";
import { getActorComponent } from "./actor-component";
import { getPwActorDefinition } from "../prefabs/definitions/actor-definitions";

jest.mock("./actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../prefabs/definitions/actor-definitions", () => ({ getPwActorDefinition: jest.fn() }));

describe("actor data resource history boundary (authored; final gate pending)", () => {
  beforeEach(() => { jest.clearAllMocks(); jest.mocked(getActorComponent).mockReturnValue(undefined); });

  it("fences component map edits before mutation and preserves native actor change callbacks", () => {
    class Existing {}
    class Added {}
    const scene = {} as Phaser.Scene, existing = new Existing(), added = new Added();
    const components = new Map([[Existing, existing]]), systems = new Map();
    let actorData = new ActorData(components, systems);
    const actor = {
      scene, emit: jest.fn(), getData: (key: string) => key === ActorDataKey ? actorData : undefined,
      setData: (_key: string, value: ActorData) => { actorData = value; }
    } as unknown as Phaser.GameObjects.GameObject;
    const losses: string[] = [], beforeFence = [false, true], release = subscribeSceneResourceLoss(scene, (reason) => {
      losses.push(reason);
      expect(actorData.components.has(Added)).toBe(beforeFence.shift());
    });
    addActorComponent(actor, added);
    expect(actorData.components.get(Added)).toBe(added);
    expect(actor.emit).toHaveBeenCalledWith("actorDataChanged", actorData);
    removeActorComponent(actor, added);
    expect(actorData.components.has(Added)).toBe(false);
    expect(actorData.components.get(Existing)).toBe(existing);
    expect(losses).toEqual(["resource_actor_components_change", "resource_actor_components_change"]);
    release();
  });

  it("retains the old component map and skips the actor notification if setup throws after the fence", () => {
    const scene = {} as Phaser.Scene, actorData = new ActorData(new Map(), new Map());
    const failure = new Error("get_data");
    const actor = { scene, emit: jest.fn(), getData: () => { throw failure; } } as unknown as Phaser.GameObjects.GameObject;
    const losses: string[] = [], release = subscribeSceneResourceLoss(scene, (reason) => losses.push(reason));
    expect(() => addActorComponent(actor, {})).toThrow(failure);
    expect(losses).toEqual(["resource_actor_components_change"]);
    expect(actor.emit).not.toHaveBeenCalled();
    expect(actorData.components.size).toBe(0);
    release();
  });

  it("fences before constructor work and preserves a native constructor failure without publishing partial data", () => {
    const scene = {} as Phaser.Scene;
    const actor = { scene, name: "resource", getData: jest.fn(), setData: jest.fn(), emit: jest.fn() } as
      unknown as Phaser.GameObjects.GameObject;
    jest.mocked(getPwActorDefinition).mockReturnValue({ components: { resourceSource: {
      resourceType: "wood", maximumResources: 10, gatheringFactor: 1, cooldown: 10
    } } } as never);
    const losses: string[] = [], release = subscribeSceneResourceLoss(scene, (reason) => {
      losses.push(reason);
      expect(getPwActorDefinition).not.toHaveBeenCalled();
      expect(actor.getData).not.toHaveBeenCalled();
    });
    expect(() => setFullActorDataFromName(actor)).toThrow();
    expect(losses).toEqual(["resource_actor_components_change"]);
    expect(actor.setData).not.toHaveBeenCalled(); expect(actor.emit).not.toHaveBeenCalled();
    release();
  });
});
