// You can write more code here

/* START OF COMPILED CODE */

import StairsTopLeft from "./StairsTopLeft";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class Stairs extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 48);

    this.blendMode = Phaser.BlendModes.SKIP_CHECK;

    // cursor
    const cursor = scene.add.image(
      0.03889938974372242,
      -0.04250807446052818,
      "factions",
      "buildings/tivara/stairs/stairs_top_left.png"
    );
    cursor.setOrigin(0.5, 0.75);
    cursor.visible = false;
    this.add(cursor);

    // foundation
    const foundation = scene.add.image(
      1.0388993897437224,
      -33.04250807446053,
      "factions",
      "buildings/tivara/wall/foundation/foundation_1.png"
    );
    foundation.visible = false;
    this.add(foundation);

    // editorStairs
    const editorStairs = new StairsTopLeft(scene, 0.03889938974372242, -0.04250807446052818);
    this.add(editorStairs);

    this.cursor = cursor;
    this.foundation = foundation;

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  private cursor: Phaser.GameObjects.Image;
  private foundation: Phaser.GameObjects.Image;

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
