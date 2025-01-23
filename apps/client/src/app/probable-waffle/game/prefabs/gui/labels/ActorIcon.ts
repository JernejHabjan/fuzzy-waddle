
// You can write more code here

/* START OF COMPILED CODE */

import OnPointerUpScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerUpScript";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class ActorIcon extends Phaser.GameObjects.Container {

  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 0, y ?? 0);

    this.blendMode = Phaser.BlendModes.SKIP_CHECK;

    // bg
    const bg = scene.add.nineslice(8, 8, "gui", "cryos_mini_gui/surfaces/surface_dark.png", 16, 16, 2, 2, 2, 2);
    this.add(bg);

    // onPointerUpScript
    new OnPointerUpScript(bg);

    // nr
    const nr = scene.add.text(4, 1, "", {});
    nr.text = "2";
    nr.setStyle({ "fontSize": "14px" });
    this.add(nr);

    // image_1
    const image_1 = scene.add.image(8, 8, "factions", "character_icons/general/warrior.png");
    image_1.scaleX = 0.22;
    image_1.scaleY = 0.22;
    this.add(image_1);

    this.bg = bg;
    this.nr = nr;

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  private bg: Phaser.GameObjects.NineSlice;
  private nr: Phaser.GameObjects.Text;

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
