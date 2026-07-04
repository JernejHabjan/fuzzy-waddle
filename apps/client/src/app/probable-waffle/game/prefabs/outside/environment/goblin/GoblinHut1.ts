
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class GoblinHut1 extends Phaser.Scene {

  constructor() {
    super("GoblinHut1");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {

    // container_1
    const container_1 = this.add.container(31.64756093328292, 49.19472343094474);
    container_1.setInteractive(new Phaser.Geom.Circle(-0.1475617469369297, -21.694721825268388, 37.83005802649617), Phaser.Geom.Circle.Contains);

    // goblin_hut_base_png
    const goblin_hut_base_png = this.add.image(2.3524390667170785, -7.194723430944741, "environment_1", "goblin/hut_base.png");
    goblin_hut_base_png.flipX = true;
    container_1.add(goblin_hut_base_png);

    // goblin_roof3_png
    const goblin_roof3_png = this.add.image(0.3524390667170785, -24.19472343094474, "environment_1", "goblin/roof3.png");
    container_1.add(goblin_roof3_png);

    // goblin_hut_base_left_fence_png
    const goblin_hut_base_left_fence_png = this.add.image(7.3524390667170785, -5.194723430944741, "environment_1", "goblin/hut_base_left_fence.png");
    goblin_hut_base_left_fence_png.flipX = true;
    container_1.add(goblin_hut_base_left_fence_png);

    // goblin_spikes3_png
    const goblin_spikes3_png = this.add.image(-25.64756093328292, -6.194723430944741, "environment_1", "goblin/spikes3.png");
    goblin_spikes3_png.flipX = true;
    container_1.add(goblin_spikes3_png);

    // goblin_roof2_png
    const goblin_roof2_png = this.add.image(1.3524390667170785, -44.19472343094474, "environment_1", "goblin/roof2.png");
    container_1.add(goblin_roof2_png);

    // goblin_skull2_png
    const goblin_skull2_png = this.add.image(-12.647560933282922, -17.19472343094474, "environment_1", "goblin/skull2.png");
    goblin_skull2_png.scaleX = 0.3413776563569858;
    goblin_skull2_png.scaleY = 0.3413776563569858;
    container_1.add(goblin_skull2_png);

    // goblin_skull2_png_1
    const goblin_skull2_png_1 = this.add.image(-26.64756093328292, -21.19472343094474, "environment_1", "goblin/skull2.png");
    goblin_skull2_png_1.scaleX = 0.3413776563569858;
    goblin_skull2_png_1.scaleY = 0.3413776563569858;
    container_1.add(goblin_skull2_png_1);

    this.events.emit("scene-awake");
  }

  /* START-USER-CODE */

  // Write your code here

  create() {

    this.editorCreate();
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
