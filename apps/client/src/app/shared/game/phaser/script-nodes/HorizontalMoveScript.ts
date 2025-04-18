// You can write more code here

/* START OF COMPILED CODE */

import SpriteScriptNode from "../script-nodes-basic/SpriteScriptNode";
import ScriptNode from "../script-nodes-basic/ScriptNode";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class HorizontalMoveScript extends SpriteScriptNode {
  constructor(parent: ScriptNode | Phaser.GameObjects.GameObject | Phaser.Scene) {
    super(parent);

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  public horizVelocity: number = 0;
  public minX: number = 0;
  public maxX: number = 3070;

  /* START-USER-CODE */

  start() {
    this.body.velocity.x = this.horizVelocity;
  }

  private get body() {
    return this.gameObject.body as Phaser.Physics.Arcade.Body;
  }

  update() {
    if (this.gameObject.x < this.minX) {
      this.body.velocity.x = Math.abs(this.horizVelocity);
    }

    if (this.gameObject.x > this.maxX) {
      this.body.velocity.x = -Math.abs(this.horizVelocity);
    }
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
