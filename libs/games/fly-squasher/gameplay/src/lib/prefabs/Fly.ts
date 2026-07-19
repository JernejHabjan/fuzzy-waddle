// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Fly extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 60, y ?? 57);

    // leg_back_right
    const leg_back_right = scene.add.image(
      14.450684318372382,
      -0.6341442773239621,
      "fly-squasher-spritesheet",
      "fly/leg-back"
    );
    leg_back_right.setOrigin(0, 1);
    this.add(leg_back_right);

    // leg_back_left
    const leg_back_left = scene.add.image(
      -15.549315681627625,
      -2.634144277323962,
      "fly-squasher-spritesheet",
      "fly/leg-back"
    );
    leg_back_left.setOrigin(1, 1);
    leg_back_left.flipX = true;
    this.add(leg_back_left);

    // leg_front_right
    const leg_front_right = scene.add.image(
      12.450684318372382,
      31.365855722676038,
      "fly-squasher-spritesheet",
      "fly/leg-front"
    );
    leg_front_right.setOrigin(0, 0);
    this.add(leg_front_right);

    // leg_front_left
    const leg_front_left = scene.add.image(
      -13.549315681627625,
      31.365855722676038,
      "fly-squasher-spritesheet",
      "fly/leg-front"
    );
    leg_front_left.setOrigin(1, 0);
    leg_front_left.flipX = true;
    this.add(leg_front_left);

    // leg_middle_right
    const leg_middle_right = scene.add.image(
      12.450684318372382,
      8.365855722676038,
      "fly-squasher-spritesheet",
      "fly/leg-middle"
    );
    leg_middle_right.setOrigin(0, 0.5);
    this.add(leg_middle_right);

    // leg_middle_left
    const leg_middle_left = scene.add.image(
      -13.549315681627625,
      7.365855722676038,
      "fly-squasher-spritesheet",
      "fly/leg-middle"
    );
    leg_middle_left.setOrigin(1, 0.5);
    leg_middle_left.flipX = true;
    this.add(leg_middle_left);

    // body
    const body = scene.add.image(0, -4, "fly-squasher-spritesheet", "fly/body");
    this.add(body);

    // wing_left
    const wing_left = scene.add.image(-16, 21, "fly-squasher-spritesheet", "fly/wing");
    wing_left.setOrigin(0.27, 0.98);
    this.add(wing_left);

    // wing_right
    const wing_right = scene.add.image(15.770684318372375, 22.39585572267604, "fly-squasher-spritesheet", "fly/wing");
    wing_right.setOrigin(0.7, 0.99);
    wing_right.flipX = true;
    this.add(wing_right);

    // head_container
    const head_container = scene.add.container(-0.949315681627624, 35.59585572267604);
    this.add(head_container);

    // fly_head
    const fly_head = scene.add.image(0.4, 0, "fly-squasher-spritesheet", "fly/head");
    fly_head.setOrigin(0.5, 0);
    head_container.add(fly_head);

    // fly_suckler
    const fly_suckler = scene.add.image(0, 19.8, "fly-squasher-spritesheet", "fly/suckler");
    fly_suckler.setOrigin(0.58, 0);
    head_container.add(fly_suckler);

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
