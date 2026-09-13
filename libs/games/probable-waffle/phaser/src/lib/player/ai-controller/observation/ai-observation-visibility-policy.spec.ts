import Phaser from "phaser";
import { ActorData, ActorDataKey } from "../../../data/actor-data";
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { AiObservationVisibilityPolicy } from "./ai-observation-visibility-policy";

function actor(owner: number): Phaser.GameObjects.GameObject {
  const ownerComponent = Object.assign(Object.create(OwnerComponent.prototype), { getOwner: () => owner });
  return {
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
