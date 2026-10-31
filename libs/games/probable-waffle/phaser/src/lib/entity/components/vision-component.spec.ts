import type Phaser from "phaser";
import type { VisionDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/vision-definition";
import { VisionComponent } from "./vision-component";

describe("VisionComponent", () => {
  it("ignores inactive or foreign-scene actors before querying their position", () => {
    const scene = {} as Phaser.Scene;
    const source = { scene, active: true } as unknown as Phaser.GameObjects.GameObject;
    const vision = new VisionComponent(source, { range: 5 } as VisionDefinition);

    expect(vision.isActorVisible({ scene: {}, active: true } as unknown as Phaser.GameObjects.GameObject)).toBe(false);
    expect(vision.isActorVisible({ scene, active: false } as unknown as Phaser.GameObjects.GameObject)).toBe(false);
  });
});
