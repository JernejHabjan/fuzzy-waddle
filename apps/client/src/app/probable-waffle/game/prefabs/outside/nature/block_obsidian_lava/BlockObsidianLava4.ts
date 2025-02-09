// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { LavaParticles } from "../../../../effects/particles/LavaParticles";
import { setActorData } from "../../../../data/actor-data";
import { ColliderComponent } from "../../../../entity/actor/components/collider-component";
import {
  ObjectDescriptorComponent,
  ObjectDescriptorDefinition
} from "../../../../entity/actor/components/object-descriptor-component";
/* END-USER-IMPORTS */

export default class BlockObsidianLava4 extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-32 -32 0 -48 32 -32 31.94308756244577 1.2220034195229061 0.28628033313970036 16 -31.98714686381638 0.6221098782742516"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // image_1
    const image_1 = scene.add.image(0, -16, "outside", "nature/block_obsidian/1.png");
    this.add(image_1);

    // outside_nature_block_obsidian_lava_4
    const outside_nature_block_obsidian_lava_4 = scene.add.image(
      0,
      -17.87410141979456,
      "outside",
      "nature/block_obsidian_lava/4.png"
    );
    outside_nature_block_obsidian_lava_4.setOrigin(0.5, 0.470717165742086);
    this.add(outside_nature_block_obsidian_lava_4);

    /* START-USER-CTR-CODE */
    setActorData(
      this,
      [
        new ObjectDescriptorComponent({
          color: 0xbd3c00
        } satisfies ObjectDescriptorDefinition),
        new ColliderComponent(this)
      ],
      []
    );
    this.particles = new LavaParticles(scene, this.x, this.y);
    /* END-USER-CTR-CODE */
  }

  public z: number = 0;

  /* START-USER-CODE */

  private particles: LavaParticles;

  setDepth(value: number): this {
    this.particles.setDepth(value);
    return super.setDepth(value);
  }

  override destroy(fromScene?: boolean) {
    this.particles.destroy();
    super.destroy(fromScene);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
