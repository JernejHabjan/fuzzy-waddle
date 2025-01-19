// You can write more code here

/* START OF COMPILED CODE */

import ScriptNode from "../script-nodes-basic/ScriptNode";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class PushActionScript extends ScriptNode {
  constructor(parent: ScriptNode | Phaser.GameObjects.GameObject | Phaser.Scene) {
    super(parent);

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  private disabled: boolean = false;
  setDisabled(disabled: boolean) {
    this.disabled = disabled;
  }

  override execute(args?: any): void {
    if (this.disabled) return;
    this.scene.add.tween({
      targets: this.gameObject,
      scaleX: "*=0.8",
      scaleY: "*=0.8",
      duration: 80,
      yoyo: true,
      onYoyo: () => {
        this.executeChildren(args);
      }
    });
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
