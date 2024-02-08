// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { setActorData } from "../../../../../data/actor-data";
import { SelectableComponent } from "../../../../../entity/actor/components/selectable-component";
import {
  ResourceSourceComponent,
  ResourceSourceDefinition
} from "../../../../../entity/economy/resource/resource-source-component";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ContainerComponent, ContainerDefinition } from "../../../../../entity/building/container-component";
import { IdComponent } from "../../../../../entity/actor/components/id-component";
import { ColliderComponent } from "../../../../../entity/actor/components/collider-component";
/* END-USER-IMPORTS */

export default class Tree5 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 64, y ?? 220, texture || "outside", frame ?? "foliage/trees/resources/tree5.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "15.340660978964024 33.00603992235928 31.62097021533904 6.289635021641303 48.73616710486149 37.18047818809646 57.085043636335854 77.88125127903399 49.98849858458264 86.23012781050836 45.81406031884546 99.58833026086735 34.96052082792878 103.34532470003082 36.4215742209368 114.82502993080806 28.072697689462434 114.82502993080806 26.40292238316756 98.33599878114619 7.826672100637094 84.97779633078721 6.15689679434222 56.80033803706122"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.scaleX = 2;
    this.scaleY = 2;
    this.setOrigin(0.5, 0.859375);

    /* START-USER-CTR-CODE */
    setActorData(
      this,
      [
        new IdComponent(),
        new ColliderComponent(),
        new SelectableComponent(this),
        new ResourceSourceComponent(this, {
          resourceType: ResourceType.Wood,
          maximumResources: 100,
          gatheringFactor: 1
        } satisfies ResourceSourceDefinition),
        new ContainerComponent(this, {
          capacity: 2
        } satisfies ContainerDefinition)
      ],
      []
    );
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
