// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { setActorData } from "../../../../../data/actor-data";
import {
  ResourceSourceComponent,
  ResourceSourceDefinition
} from "../../../../../entity/economy/resource/resource-source-component";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { SelectableComponent } from "../../../../../entity/actor/components/selectable-component";
import { IdComponent } from "../../../../../entity/actor/components/id-component";
import { ColliderComponent, ColliderDefinition } from "../../../../../entity/actor/components/collider-component";
/* END-USER-IMPORTS */

export default class Tree1 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 64, y ?? 350, texture || "outside", frame ?? "foliage/trees/resources/tree1.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "9.50898862920253 84.3071381154135 31.7553002941515 46.17060383264382 47.3158245459587 69.86247500887781 62.08358924839645 120.642858897962 53.274747145187966 144.7376328861499 37.7297316689377 152.76922421554588 38.97812875679727 179.64847382233765 24.2435586929999 180.22630009934932 24.2435586929999 154.22411763382453 6.619857244144221 138.91172129301552 5.464204690120898 118.1099753205957"
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
        new IdComponent(),
        new ColliderComponent({
          colliderFactorReduction: 0.5
        } satisfies ColliderDefinition),
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
