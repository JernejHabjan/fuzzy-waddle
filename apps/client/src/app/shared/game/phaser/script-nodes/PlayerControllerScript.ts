// You can write more code here

/* START OF COMPILED CODE */

import SpriteScriptNode from "../script-nodes-basic/SpriteScriptNode";
import ScriptNode from "../script-nodes-basic/ScriptNode";
/* START-USER-IMPORTS */
import Player from "../prefabs/Player";
/* END-USER-IMPORTS */

export default class PlayerControllerScript extends SpriteScriptNode {
  constructor(parent: ScriptNode | Phaser.GameObjects.GameObject | Phaser.Scene) {
    super(parent);

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  public player!: Player | undefined;
  public direction: "left" | "right" | "up" = "left";

  /* START-USER-CODE */

  update() {
    const input = this.gameObject.scene.input;

    if (!input.activePointer.isDown) {
      return;
    }

    const objects = input.hitTestPointer(input.activePointer);

    if (objects.indexOf(this.gameObject) >= 0) {
      console.log("pressButton", this.direction);
      this.player?.pressButton(this.direction);
    }
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
