// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { RandomMovementComponent } from "../../../entity/components/movement/random-movement.component";
import { onObjectReady } from "../../../data/game-object-helper";
import type { RandomMovementDefinition } from "../../../entity/components/movement/random-movement-definition";
/* END-USER-IMPORTS */

export default class Hare extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 24, y ?? 37, texture || "hunt_animals", frame ?? "Hare/Idle/front/Hare_Idle_front1.png");

    this.setInteractive(new Phaser.Geom.Circle(16, 16, 11.114774739503424), Phaser.Geom.Circle.Contains);
    this.scaleX = 1.5;
    this.scaleY = 1.5;
    this.setOrigin(0.5, 0.773612963520417);
    this.play("Hare/Idle/front/Hare_Idle_front");

    /* START-USER-CTR-CODE */
    onObjectReady(this, this.init, this);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  override name = ObjectNames.Hare;
  private init() {
    new RandomMovementComponent(this, {
      radius: 2,
      shouldPreventMovementStart: () => false,
      delay: {
        min: 2000,
        max: 5000
      }
    } satisfies RandomMovementDefinition);
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
