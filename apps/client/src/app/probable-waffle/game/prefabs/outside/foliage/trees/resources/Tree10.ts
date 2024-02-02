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
/* END-USER-IMPORTS */

export default class Tree10 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 46, y ?? 81.26384417939924, texture || "outside", frame ?? "foliage/trees/resources/tree10.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "4.193840323421412 29.447687344756716 47.028453916909534 15.89999560356047 87.87075990139822 30.443841149256443 84.88229848789904 47.77691734755164 63.365376310705 73.27845474274457 53.20460750480782 76.66537767804363 51.411530656708315 86.62691572304087 37.26614663281224 86.02922344034103 35.67230054561268 64.31307050224704 3.596148040721573 42.19845604235318"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.8833026541239049);

    /* START-USER-CTR-CODE */
    setActorData(
      this,
      [
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
