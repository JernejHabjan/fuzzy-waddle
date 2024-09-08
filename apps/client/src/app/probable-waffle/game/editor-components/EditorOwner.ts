// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { getActorComponent } from "../data/actor-component";
import { OwnerComponent } from "../entity/actor/components/owner-component";
/* END-USER-IMPORTS */

export default class EditorOwner {
  constructor(gameObject: Phaser.GameObjects.GameObject) {
    this.gameObject = gameObject;
    (gameObject as any)["__EditorOwner"] = this;

    /* START-USER-CTR-CODE */
    gameObject.scene.events.once("scene-awake", this.awake, this);
    /* END-USER-CTR-CODE */
  }

  static getComponent(gameObject: Phaser.GameObjects.GameObject): EditorOwner {
    return (gameObject as any)["__EditorOwner"];
  }

  private gameObject: Phaser.GameObjects.GameObject;
  public owner_id: "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "-1" = "-1";

  /* START-USER-CODE */
  private awake() {
    if (!!this.owner_id && this.owner_id !== "-1") {
      const ownerComponent = getActorComponent(this.gameObject, OwnerComponent);
      if (ownerComponent) ownerComponent.setOwner(parseInt(this.owner_id));
    }
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
