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
import { IdComponent } from "../../../../../entity/actor/components/id-component";
import { ColliderComponent } from "../../../../../entity/actor/components/collider-component";
/* END-USER-IMPORTS */

export default class Tree9 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 64, y ?? 172.95579279773938, texture || "outside", frame ?? "foliage/trees/resources/tree9.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "7.082902511161393 1.2876334322518659 64 0 119.42461645248203 1.9747387162966419 125.26501136686261 31.520265930221953 111.17935304394473 43.201055758983124 99.84211585720595 68.96750391066216 121.82948494663874 88.20645186391585 76.13698355766124 109.50671566930386 84.03869432417613 180.27855992591563 61.70777259272097 185.43184955625145 42.81237728148967 180.9656652099604 48.30921955384787 116.72132115177399 9.144218363295714 99.88724169267701 8.113560437228557 86.83224129582631 32.50579802081805 69.99816183672932 6.395797227116617 46.29302953718461"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.9008114208215593);

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
        } satisfies ResourceSourceDefinition)
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
