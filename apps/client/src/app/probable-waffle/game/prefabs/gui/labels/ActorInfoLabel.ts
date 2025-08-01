// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { IconHelper } from "./IconHelper";
/* END-USER-IMPORTS */

export default class ActorInfoLabel extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 16, y ?? 11);

    // icon
    const icon = scene.add.image(0, 5, "gui", "actor_info_icons/sword.png");
    this.add(icon);

    // text
    const text = scene.add.text(19, 5, "", {});
    text.setOrigin(0, 0.5);
    text.text = "New text";
    text.setStyle({ color: "#000000ff", fontFamily: "disposabledroid", fontSize: "26px", resolution: 10 });
    this.add(text);

    this.icon = icon;
    this.text = text;

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  public icon: Phaser.GameObjects.Image;
  public text: Phaser.GameObjects.Text;

  /* START-USER-CODE */

  setText(text: string) {
    this.text.text = text;
  }

  setIcon(key: string | undefined, frame?: string, height = 32) {
    this.icon.visible = !!key;
    if (!key || !frame) return;

    // noinspection JSSuspiciousNameCombination
    IconHelper.setIcon(this.icon, key, frame, { x: 0.5, y: 0.5 }, { maxWidth: height, maxHeight: height });
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
