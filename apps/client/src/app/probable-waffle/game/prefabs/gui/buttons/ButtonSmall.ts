// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { EventEmitter } from "@angular/core";
/* END-USER-IMPORTS */

export default class ButtonSmall extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 4, y ?? 9);

    // btnEle
    const btnEle = scene.add.nineslice(6, 1, "gui", "cryos_mini_gui/buttons/button_small.png", 20, 20, 3, 3, 3, 3);
    this.add(btnEle);

    // textEle
    const textEle = scene.add.text(6, 1, "", {});
    textEle.setOrigin(0.5, 0.5);
    textEle.setStyle({ align: "center" });
    this.add(textEle);

    // image_1
    const image_1 = scene.add.image(6, 1, "_MISSING");
    image_1.scaleX = 0.2;
    image_1.scaleY = 0.2;
    this.add(image_1);

    this.btnEle = btnEle;
    this.textEle = textEle;
    this.image_1 = image_1;

    /* START-USER-CTR-CODE */
    this.scene = scene;
    scene.events.once(Phaser.Scenes.Events.CREATE, () => {
      this.postCreate();
    });
    /* END-USER-CTR-CODE */
  }

  private btnEle: Phaser.GameObjects.NineSlice;
  private textEle: Phaser.GameObjects.Text;
  private image_1: Phaser.GameObjects.Image;
  public text: string = "";
  public w: number = 20;
  public h: number = 20;
  public fontSize: number = 16;
  public buttonImage!: { key: string; frame?: string | number };

  /* START-USER-CODE */
  scene: Phaser.Scene;
  clicked = new EventEmitter<void>();

  // Write your code here.
  postCreate() {
    this.textEle.text = this.text;
    this.textEle.setFontSize(this.fontSize);
    this.btnEle.width = this.w;
    this.btnEle.height = this.h;

    this.btnEle.setInteractive();
    this.btnEle.on("pointerdown", () => {
      this.btnEle.setTexture("gui", "cryos_mini_gui/buttons/button_small_pressed.png");
    });
    // button out
    this.btnEle.on("pointerout", () => {
      if (!this.scene.sys.textures) return;
      this.btnEle.setTexture("gui", "cryos_mini_gui/buttons/button_small.png");
    });
    this.btnEle.on("pointerup", () => {
      this.clicked.emit();
      if (!this.scene.sys.textures) return;
      this.btnEle.setTexture("gui", "cryos_mini_gui/buttons/button_small.png");
    });
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
