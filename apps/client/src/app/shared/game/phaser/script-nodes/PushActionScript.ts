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
  private originalAlpha: number | null = null;
  private activeTween: Phaser.Tweens.Tween | null = null; // Track the active tween

  setDisabled(disabled: boolean) {
    this.disabled = disabled;
  }

  override execute(args?: any): void {
    if (this.disabled) return;

    const gameObject = this.gameObject;
    const gameObjectAny = gameObject as any;

    if (!gameObject) return;

    // Store the original alpha if not already stored
    if (this.originalAlpha === null && gameObjectAny.alpha !== undefined) {
      this.originalAlpha = gameObjectAny.alpha;
    }

    // If a tween is already running, stop it and reset the alpha
    if (this.activeTween) {
      this.activeTween.stop();
      this.resetAlpha();
      this.activeTween = null;
    } else {
      // Always reset alpha before starting a new tween
      this.resetAlpha();
    }

    this.activeTween = this.scene.add.tween({
      targets: gameObject,
      alpha: 0.6,
      duration: 80,
      yoyo: true,
      onYoyo: () => {
        this.executeChildren(args);
      },
      onComplete: () => {
        this.resetAlpha();
        this.activeTween = null;
      }
    });
  }

  private resetAlpha() {
    const gameObject = this.gameObject as any;
    if (gameObject && this.originalAlpha !== null) {
      gameObject.alpha = this.originalAlpha;
    }
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
