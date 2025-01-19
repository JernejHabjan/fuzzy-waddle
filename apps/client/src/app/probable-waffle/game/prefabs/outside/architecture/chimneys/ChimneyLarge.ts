// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { setActorData } from "../../../../data/actor-data";
import { ColliderComponent } from "../../../../entity/actor/components/collider-component";
import {
  ObjectDescriptorComponent,
  ObjectDescriptorDefinition
} from "../../../../entity/actor/components/object-descriptor-component";
/* END-USER-IMPORTS */

export default class ChimneyLarge extends Phaser.GameObjects.Image {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 16, y ?? 40, texture || "outside", frame ?? "architecture/chimneys/chimney_large.png");

		this.setInteractive(new Phaser.Geom.Polygon("-0.04080848124392844 8.379095963866511 16 0 32.02005391878456 8.379095963866511 31.934785667720657 40.52522661495891 15.904354414152579 48 -0.12607673230783334 40.01361710857548"), Phaser.Geom.Polygon.Contains);
		this.setOrigin(0.5, 0.833333);

		/* START-USER-CTR-CODE */
    setActorData(
      this,
      [
        new ObjectDescriptorComponent({
          color: 0x95a083
        } satisfies ObjectDescriptorDefinition),
        new ColliderComponent()
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
