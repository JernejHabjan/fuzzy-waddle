// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { getActorComponent } from "../../../data/actor-component";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { addActorComponent } from "../../../data/actor-data";
import { ConvertibleComponent } from "../../../entity/components/convertible-component";
/* END-USER-IMPORTS */

export default class EditorConvertible {
  constructor(gameObject: Phaser.GameObjects.GameObject) {
    this.gameObject = gameObject;
    (gameObject as any)["__EditorConvertible"] = this;

    /* START-USER-CTR-CODE */
    gameObject.scene.events.once("scene-awake", this.awake, this);
    /* END-USER-CTR-CODE */
  }

  static getComponent(gameObject: Phaser.GameObjects.GameObject): EditorConvertible {
    return (gameObject as any)["__EditorConvertible"];
  }

  private gameObject: Phaser.GameObjects.GameObject;
  public detection_range: number = 8;
  public check_interval: number = 500;

  /* START-USER-CODE */
  private awake() {
    // Only add ConvertibleComponent if no owner is set
    const ownerComponent = getActorComponent(this.gameObject, OwnerComponent);
    if (!ownerComponent || ownerComponent.getOwner() === undefined) {
      const convertibleComponent = new ConvertibleComponent(this.gameObject, {
        detectionRange: this.detection_range,
        checkInterval: this.check_interval
      });
      addActorComponent(this.gameObject, convertibleComponent);
    }
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
