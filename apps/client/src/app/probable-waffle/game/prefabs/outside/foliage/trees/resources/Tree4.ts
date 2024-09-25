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
/* END-USER-IMPORTS */

export default class Tree4 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 64, y ?? 220, texture || "outside", frame ?? "foliage/trees/resources/tree4.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "17.126452532837842 37.49420057180926 32.01530539804208 11.915914880304541 47.52239276454823 35.83182927321798 51.294461031191155 80.25193187701116 42.51385549530148 98.19490840687267 34.496780875576114 99.72197023920131 35.83295997886368 114.99258856248771 27.62500263009724 114.03817491728232 27.24323717201508 97.43137749070836 20.75322438461836 91.89577834851704 12.545267035851921 83.30605554166844 13.881446139139484 56.96423893399941"
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
        new ObjectDescriptorComponent({
          color: 0xbea55b
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

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
