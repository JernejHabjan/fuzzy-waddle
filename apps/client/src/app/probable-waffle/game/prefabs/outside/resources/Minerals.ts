// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { setActorData } from "../../../data/actor-data";
import { IdComponent } from "../../../entity/actor/components/id-component";
import { SelectableComponent, SelectableDefinition } from "../../../entity/actor/components/selectable-component";
import {
  ResourceSourceComponent,
  ResourceSourceDefinition
} from "../../../entity/economy/resource/resource-source-component";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import {
  ObjectDescriptorComponent,
  ObjectDescriptorDefinition
} from "../../../entity/actor/components/object-descriptor-component";
import { ObjectNames } from "../../../data/object-names";
/* END-USER-IMPORTS */

export default class Minerals extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 32,
      y ?? 47.65448335874778,
      texture || "outside",
      frame ?? "nature/resources/minerals_pile_1.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "17.073814436779283 25.3026667577094 33.18736938562811 23.619161016784897 49.78192597474108 26.505170858369762 60.60446288068432 33.72019546233192 59.16145795989189 50.07425123131282 34.63037430642054 63.06129551844471 2.4032644087228867 46.46673892933174"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.7446013024804341);

    /* START-USER-CTR-CODE */
    setActorData(
      this,
      [
        new ObjectDescriptorComponent({
          color: 0x2b8acd
        } satisfies ObjectDescriptorDefinition),
        new IdComponent(),
        new SelectableComponent(this, { offsetY: 16 } satisfies SelectableDefinition),
        new ResourceSourceComponent(this, {
          resourceType: ResourceType.Minerals,
          maximumResources: 100,
          gatheringFactor: 1
        } satisfies ResourceSourceDefinition)
      ],
      []
    );
    this.setFrame(
      `nature/resources/${this.availableMinerals[Math.floor(Math.random() * this.availableMinerals.length)]}`
    );
    // randomly flip by Y axis
    if (Math.random() > 0.5) {
      this.flipX = true;
    }
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.Minerals;
  private readonly availableMinerals = ["minerals_pile_1.png", "minerals_pile_2.png"];

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
