// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class ActorInfoLabel extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 16, y ?? 11);

    // actor_info_icons_sword_png
    const actor_info_icons_sword_png = scene.add.image(0, 5, "gui", "actor_info_icons/sword.png");
    this.add(actor_info_icons_sword_png);

    // text_1
    const text_1 = scene.add.text(19, 5, "", {});
    text_1.setOrigin(0, 0.5);
    text_1.text = "New text";
    text_1.setStyle({ color: "#000000ff" });
    this.add(text_1);

    this.actor_info_icons_sword_png = actor_info_icons_sword_png;
    this.text_1 = text_1;

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  public actor_info_icons_sword_png: Phaser.GameObjects.Image;
  public text_1: Phaser.GameObjects.Text;

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
