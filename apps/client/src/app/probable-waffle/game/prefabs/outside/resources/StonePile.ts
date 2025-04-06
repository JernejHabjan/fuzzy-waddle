// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { setActorData } from "../../../data/actor-data";
import { IdComponent } from "../../../entity/actor/components/id-component";
import { SelectableComponent, SelectableDefinition } from "../../../entity/actor/components/selectable-component";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import {
  ResourceSourceComponent,
  ResourceSourceDefinition
} from "../../../entity/economy/resource/resource-source-component";
import {
  ObjectDescriptorComponent,
  ObjectDescriptorDefinition
} from "../../../entity/actor/components/object-descriptor-component";
import { ObjectNames } from "../../../data/object-names";
/* END-USER-IMPORTS */

export default class StonePile extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 47.223497563360624, texture || "outside", frame ?? "nature/resources/stone_pile_1.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "5.025616438265331 39.13261986381158 32.15891862605808 25.16299893544304 60.36680703910994 35.10292151908988 63.590565714887305 49.072542447458424 34.03944452026154 63.57945648845653 0.45862498091407744 47.72930966588453"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.7378671494275097);

    /* START-USER-CTR-CODE */
    setActorData(
      this,
      [
        new ObjectDescriptorComponent({
          color: 0x7e7c78
        } satisfies ObjectDescriptorDefinition),
        new IdComponent(),
        new SelectableComponent(this, { offsetY: 16 } satisfies SelectableDefinition),
        new ResourceSourceComponent(this, {
          resourceType: ResourceType.Stone,
          maximumResources: 100,
          gatheringFactor: 1
        } satisfies ResourceSourceDefinition)
      ],
      []
    );
    this.setFrame(
      `nature/resources/${this.availableRockPiles[Math.floor(Math.random() * this.availableRockPiles.length)]}`
    );
    // randomly flip by Y axis
    if (Math.random() > 0.5) {
      this.flipX = true;
    }
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.Stone;
  private readonly availableRockPiles = ["stone_pile_1.png", "stone_pile_2.png"];

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
