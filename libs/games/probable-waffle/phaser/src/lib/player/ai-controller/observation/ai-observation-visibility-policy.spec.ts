import Phaser from "phaser";
import { ActorData, ActorDataKey } from "../../../data/actor-data";
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { VisionComponent } from "../../../entity/components/vision-component";
import { RepresentableComponent } from "../../../entity/components/representable-component";
import { AiObservationVisibilityPolicy } from "./ai-observation-visibility-policy";

function actor(owner: number, scene?: Phaser.Scene): Phaser.GameObjects.GameObject {
  const ownerComponent = Object.assign(Object.create(OwnerComponent.prototype), { getOwner: () => owner });
  return {
    active: true,
    scene,
    getData: (key: string) =>
      key === ActorDataKey ? new ActorData(new Map([[OwnerComponent, ownerComponent]]), new Map()) : undefined
  } as unknown as Phaser.GameObjects.GameObject;
}

function scene(policy: "normal" | "revealed" | "omniscient-ai"): Phaser.Scene {
  const baseGameData = {
    gameInstance: {
      players: [
        { playerNumber: 1, playerController: { data: { playerDefinition: { team: 1, campaignFogPolicy: policy } } } },
        { playerNumber: 2, playerController: { data: { playerDefinition: { team: 2 } } } },
        { playerNumber: 3, playerController: { data: { playerDefinition: { team: 1 } } } }
      ]
    }
  };
  return Object.assign(Object.create(ProbableWaffleScene.prototype), {
    baseGameData: {
      ...baseGameData
    },
    getSceneGameData: () => ({ services: [], systems: [], components: [], initializers: {}, baseGameData })
  }) as unknown as Phaser.Scene;
}

describe("Stage 4 AI visibility policy", () => {
  it("does not grant normal-skirmish visibility when no owned vision source can prove contact", () => {
    const policy = new AiObservationVisibilityPolicy(scene("normal"), 1);
    expect(policy.informationPolicy).toBe("skirmish");
    expect(policy.mayObserve(actor(2))).toBe(false);
  });

  it("keeps scripted reveal and omniscience explicit instead of inferring them from player inequality", () => {
    expect(new AiObservationVisibilityPolicy(scene("revealed"), 1).mayObserve(actor(2))).toBe(true);
    expect(new AiObservationVisibilityPolicy(scene("omniscient-ai"), 1).mayObserve(actor(2))).toBe(true);
  });

  it("uses the supplied owner scene index when a capture spans an actor with a separate scene context", () => {
    const captureScene = { baseGameData: { gameInstance: { players: [
      { playerNumber: 1, playerController: { data: { playerDefinition: { campaignFogPolicy: "normal" } } } }
    ] } } } as unknown as Phaser.Scene;
    const ownerIndex = { getOwnedActors: () => [] };
    const policy = new AiObservationVisibilityPolicy(captureScene, 1, ownerIndex);
    expect(policy.mayObserve(actor(2))).toBe(false);
  });

  it("uses owner navigation for vision-source tiles without looking up the source actor's scene", () => {
    const captureScene = { baseGameData: { gameInstance: { players: [
      { playerNumber: 1, playerController: { data: { playerDefinition: { campaignFogPolicy: "normal" } } } }
    ] } } } as unknown as Phaser.Scene;
    const source = actor(1, captureScene);
    const navigation = { getCenterTileCoordUnderObject: jest.fn(() => ({ x: 0, y: 0 })) };
    const policy = new AiObservationVisibilityPolicy(captureScene, 1, { getOwnedActors: () => [source] }, navigation);
    expect(policy.mayObserveTile({ x: 0, y: 0 })).toBe(false);
    expect(navigation.getCenterTileCoordUnderObject).toHaveBeenCalledWith(source);
  });

  it("ignores stale owned vision sources from a different scene", () => {
    const captureScene = scene("normal");
    const isActorVisible = jest.fn(() => true);
    const vision = Object.assign(Object.create(VisionComponent.prototype), { isActorVisible });
    const source = {
      active: true,
      scene: {},
      getData: (key: string) =>
        key === ActorDataKey ? new ActorData(new Map([[VisionComponent, vision]]), new Map()) : undefined
    } as unknown as Phaser.GameObjects.GameObject;
    const policy = new AiObservationVisibilityPolicy(captureScene, 1, { getOwnedActors: () => [source] });

    expect(policy.mayObserve(actor(2, captureScene))).toBe(false);
    expect(isActorVisible).not.toHaveBeenCalled();
  });

  it("requires a ground location to be within the source's full three-dimensional vision range", () => {
    const captureScene = scene("normal");
    const vision = Object.assign(Object.create(VisionComponent.prototype), { visionDefinition: { range: 5 } });
    const representable = { flyingHeightPixels: 320 };
    const source = {
      active: true,
      scene: captureScene,
      getData: (key: string) => key === ActorDataKey
        ? new ActorData(new Map([[VisionComponent, vision], [RepresentableComponent, representable]]), new Map())
        : undefined
    } as unknown as Phaser.GameObjects.GameObject;
    const navigation = { getCenterTileCoordUnderObject: () => ({ x: 0, y: 0 }) };
    const policy = new AiObservationVisibilityPolicy(captureScene, 1, { getOwnedActors: () => [source] }, navigation);
    expect(policy.mayObserveGroundTile({ x: 0, y: 0 })).toBe(true);
    expect(policy.mayObserveGroundTile({ x: 4, y: 0 })).toBe(false);
  });

  it("distinguishes allied support from enemy targets", () => {
    const policy = new AiObservationVisibilityPolicy(scene("normal"), 1);
    expect(policy.relationTo(actor(3))).toBe("ally");
    expect(policy.relationTo(actor(2))).toBe("enemy");
  });

  it("reclassifies an ownership change rather than retaining a player-inequality target rule", () => {
    const policy = new AiObservationVisibilityPolicy(scene("normal"), 1);
    expect(policy.relationTo(actor(2))).toBe("enemy");
    expect(policy.relationTo(actor(3))).toBe("ally");
  });
});
