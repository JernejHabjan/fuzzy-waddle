
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class GoblinHut extends Phaser.GameObjects.Container {

  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 30.953486320099046, y ?? 45.80095789410308);

    this.setInteractive(new Phaser.Geom.Circle(-0.4534871513064971, -27.052392960701646, 39.50143389856971), Phaser.Geom.Circle.Contains);

    // goblin_hut_base_png
    const goblin_hut_base_png = scene.add.image(1.0465136799009542, 2.199042105896922, "environment_1", "goblin/hut_base.png");
    goblin_hut_base_png.setInteractive(new Phaser.Geom.Polygon("0 16 32 0 64 16 64 48 32 64 0 48"), Phaser.Geom.Polygon.Contains);
    goblin_hut_base_png.setOrigin(0.5, 0.75);
    this.add(goblin_hut_base_png);

    // goblin_fence_nw_se_2_png_2
    const goblin_fence_nw_se_2_png_2 = scene.add.image(29.046513679900954, -17.800957894103078, "environment_1", "goblin/fence_nw_se_2.png");
    goblin_fence_nw_se_2_png_2.scaleX = 0.4179423772937699;
    goblin_fence_nw_se_2_png_2.scaleY = 0.6369858896462168;
    this.add(goblin_fence_nw_se_2_png_2);

    // goblin_fence_nw_se_2_png_1
    const goblin_fence_nw_se_2_png_1 = scene.add.image(-8.953486320099046, -9.800957894103078, "environment_1", "goblin/fence_nw_se_2.png");
    goblin_fence_nw_se_2_png_1.scaleX = 0.4179423772937699;
    goblin_fence_nw_se_2_png_1.scaleY = 0.6369858896462168;
    this.add(goblin_fence_nw_se_2_png_1);

    // goblin_fence_nw_se_2_png
    const goblin_fence_nw_se_2_png = scene.add.image(-35.953486320099046, -16.800957894103078, "environment_1", "goblin/fence_nw_se_2.png");
    goblin_fence_nw_se_2_png.scaleX = 0.4179423772937699;
    goblin_fence_nw_se_2_png.scaleY = 0.6369858896462168;
    this.add(goblin_fence_nw_se_2_png);

    // goblin_roof3_png
    const goblin_roof3_png = scene.add.image(-2.9534863200990458, -28.800957894103078, "environment_1", "goblin/roof3.png");
    this.add(goblin_roof3_png);

    // goblin_hut_base_left_fence_png
    const goblin_hut_base_left_fence_png = scene.add.image(-4.953486320099046, -4.800957894103078, "environment_1", "goblin/hut_base_left_fence.png");
    this.add(goblin_hut_base_left_fence_png);

    // goblin_roof1_png
    const goblin_roof1_png = scene.add.image(-3.9534863200990458, -49.80095789410308, "environment_1", "goblin/roof1.png");
    goblin_roof1_png.scaleX = 0.7683722690370435;
    goblin_roof1_png.scaleY = 0.6837905223322212;
    this.add(goblin_roof1_png);

    // goblin_spikes3_png
    const goblin_spikes3_png = scene.add.image(27.046513679900954, -6.800957894103078, "environment_1", "goblin/spikes3.png");
    this.add(goblin_spikes3_png);

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
