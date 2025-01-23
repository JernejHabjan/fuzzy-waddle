// You can write more code here

/* START OF COMPILED CODE */

import ActorIcon from "./ActorIcon";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class ActorInfoLabels extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 0, y ?? 0);

    this.blendMode = Phaser.BlendModes.SKIP_CHECK;

    // actorIcon1
    const actorIcon1 = new ActorIcon(scene, 10, 9);
    this.add(actorIcon1);

    // actorIcon
    const actorIcon = new ActorIcon(scene, 32, 9);
    this.add(actorIcon);

    // actorIcon_1
    const actorIcon_1 = new ActorIcon(scene, 54, 9);
    this.add(actorIcon_1);

    // actorIcon_2
    const actorIcon_2 = new ActorIcon(scene, 76, 9);
    this.add(actorIcon_2);

    // actorIcon_3
    const actorIcon_3 = new ActorIcon(scene, 98, 9);
    this.add(actorIcon_3);

    // actorIcon_4
    const actorIcon_4 = new ActorIcon(scene, 120, 9);
    this.add(actorIcon_4);

    // actorIcon_5
    const actorIcon_5 = new ActorIcon(scene, 144, 9);
    this.add(actorIcon_5);

    // actorIcon_6
    const actorIcon_6 = new ActorIcon(scene, 166, 9);
    this.add(actorIcon_6);

    // actorIcon_7
    const actorIcon_7 = new ActorIcon(scene, 10, 32);
    this.add(actorIcon_7);

    // actorIcon_8
    const actorIcon_8 = new ActorIcon(scene, 32, 32);
    this.add(actorIcon_8);

    // actorIcon_9
    const actorIcon_9 = new ActorIcon(scene, 54, 32);
    this.add(actorIcon_9);

    // actorIcon_10
    const actorIcon_10 = new ActorIcon(scene, 76, 32);
    this.add(actorIcon_10);

    // actorIcon_11
    const actorIcon_11 = new ActorIcon(scene, 98, 32);
    this.add(actorIcon_11);

    // actorIcon_12
    const actorIcon_12 = new ActorIcon(scene, 120, 32);
    this.add(actorIcon_12);

    // actorIcon_13
    const actorIcon_13 = new ActorIcon(scene, 144, 32);
    this.add(actorIcon_13);

    // actorIcon_14
    const actorIcon_14 = new ActorIcon(scene, 166, 32);
    this.add(actorIcon_14);

    // lists
    const icons = [
      actorIcon1,
      actorIcon,
      actorIcon_1,
      actorIcon_2,
      actorIcon_3,
      actorIcon_4,
      actorIcon_5,
      actorIcon_6,
      actorIcon_7,
      actorIcon_8,
      actorIcon_9,
      actorIcon_10,
      actorIcon_11,
      actorIcon_12,
      actorIcon_13,
      actorIcon_14
    ];

    this.icons = icons;

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  private icons: ActorIcon[];

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
  cleanActor() {
    // todo unsubscribe from progress
  }
}

/* END OF COMPILED CODE */

// You can write more code here
