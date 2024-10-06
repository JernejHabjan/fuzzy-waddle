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
import { ColliderComponent, ColliderDefinition } from "../../../../../entity/actor/components/collider-component";
import {
  ObjectDescriptorComponent,
  ObjectDescriptorDefinition
} from "../../../../../entity/actor/components/object-descriptor-component";
import { ObjectNames } from "../../../../../data/object-names";
/* END-USER-IMPORTS */

export default class Tree6 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 64, y ?? 350, texture || "outside", frame ?? "foliage/trees/resources/tree6.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "9.977702960675252 80.26137979733159 33.30697223012269 40.04616324714124 61.968645904015254 91.3705556399256 63.96829755568218 119.32084602647369 54.414406331051325 142.872298812773 36.86190849975277 157.31422740814523 39.528110701975336 181.08786371129642 25.308365623454996 179.97694612703702 26.19709969086252 156.86986037444146 9.533335926971493 145.76068453184746 0.6459952528962809 129.5412878016602"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.scaleX = 2;
    this.scaleY = 2;
    this.setOrigin(0.5, 0.911458);

    /* START-USER-CTR-CODE */
    setActorData(
      this,
      [
        new ObjectDescriptorComponent({
          color: 0x304f33
        } satisfies ObjectDescriptorDefinition),
        new IdComponent(),
        new ColliderComponent({
          colliderFactorReduction: 0.5
        } satisfies ColliderDefinition),
        new SelectableComponent(this),
        new ResourceSourceComponent(this, {
          resourceType: ResourceType.Wood,
          maximumResources: 20,
          gatheringFactor: 1
        } satisfies ResourceSourceDefinition)
      ],
      []
    );
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.Tree6;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
