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

export default class Tree11 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 92, y ?? 169, texture || "outside", frame ?? "foliage/trees/resources/tree11.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "3.784376857318719 27.45468445486062 20.869663472802703 17.062602905236346 48.523168613328316 11.073945741046074 91.1483166643296 21.289890315252997 88.15398808223446 46.12520384910084 57.33001738419635 60.04002490707233 59.795935040039396 89.80717375260627 35.66516940786099 90.5117216542757 30.733334096174897 84.52306449008546 40.24473076871237 63.73890139083691 29.32423829283601 46.301340824518206 7.307116365665934 36.43767020114601"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.scaleX = 2;
    this.scaleY = 2;
    this.setOrigin(0.5, 0.917368042051417);

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

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
