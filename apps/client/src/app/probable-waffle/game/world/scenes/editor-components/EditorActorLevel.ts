// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { getActorComponent } from "../../../data/actor-component";
import { LevelComponent } from "../../../entity/components/level/level-component";
import { upgradeActorToLevel } from "../../../data/actor-level-utils";
/* END-USER-IMPORTS */

export default class EditorActorLevel {
  constructor(gameObject: Phaser.GameObjects.GameObject) {
    this.gameObject = gameObject;
    (gameObject as any)["__EditorActorLevel"] = this;

    /* START-USER-CTR-CODE */
    gameObject.scene.events.once("scene-awake", this.awake, this);
    /* END-USER-CTR-CODE */
  }

  static getComponent(gameObject: Phaser.GameObjects.GameObject): EditorActorLevel {
    return (gameObject as any)["__EditorActorLevel"];
  }

  private gameObject: Phaser.GameObjects.GameObject;
  public level: number = 1;

  /* START-USER-CODE */
  private awake() {
    if (this.level > 1) {
      const levelComponent = getActorComponent(this.gameObject, LevelComponent);
      if (levelComponent && this.level <= levelComponent.maxLevel) {
        upgradeActorToLevel(this.gameObject, this.level);
      }
    }
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
