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
  private originalScaleX: number | null = null;
  private originalScaleY: number | null = null;
  setDisabled(disabled: boolean) {
    this.disabled = disabled;
  }

  override execute(args?: any): void {
    if (this.disabled) return;

    const gameObject = this.gameObject;
    const gameObjectAny = gameObject as any;

    if (!gameObject) return;

    // Store the original scale if not already stored
    if (this.originalScaleX === null && gameObjectAny.scaleX !== undefined) {
      this.originalScaleX = gameObjectAny.scaleX;
      this.originalScaleY = gameObjectAny.scaleY;
    }

    // Reset the scale to its original value before starting a new tween
    this.resetScale();

    this.scene.add.tween({
      targets: gameObject,
      scaleX: "*=0.8",
      scaleY: "*=0.8",
      duration: 80,
      yoyo: true,
      onYoyo: () => {
        this.executeChildren(args);
      },
      onComplete: () => {
        this.resetScale();
      }
    });
  }

  private resetScale() {
    const gameObject = this.gameObject as any;
    if (gameObject && this.originalScaleX !== null) {
      gameObject.scaleX = this.originalScaleX;
      gameObject.scaleY = this.originalScaleY;
    }
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
