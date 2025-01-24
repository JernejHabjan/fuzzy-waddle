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
    nr.setStyle({ fontSize: "14px" });
    this.add(nr);

    // image
    const image = scene.add.image(8, 8, "factions", "character_icons/general/warrior.png");
    image.scaleX = 0.22;
    image.scaleY = 0.22;
    this.add(image);

    this.bg = bg;
    this.nr = nr;
    this.image = image;

    /* START-USER-CTR-CODE */
    this.nr.visible = false;
    this.image.visible = false;
    /* END-USER-CTR-CODE */
  }

  private bg: Phaser.GameObjects.NineSlice;
  private nr: Phaser.GameObjects.Text;
  private image: Phaser.GameObjects.Image;

  /* START-USER-CODE */

  setActorIcon(key: string, frame: string, origin: { x: number; y: number }) {
    this.nr.visible = false;
    this.image.setTexture(key, frame);
    this.image.setOrigin(origin.x, origin.y);
    this.image.visible = true;
  }

  setNumber(number: number) {
    this.nr.text = number.toString();
    this.nr.visible = true;
    this.image.visible = false;
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
