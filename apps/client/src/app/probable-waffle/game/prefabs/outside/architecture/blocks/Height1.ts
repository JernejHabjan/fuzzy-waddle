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

export default class Height1 extends Phaser.GameObjects.Image {

	constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
		super(scene, x ?? 32, y ?? 48, texture || "outside", frame ?? "architecture/blocks/height_1.png");

		this.setInteractive(new Phaser.Geom.Polygon("0.11231818329484256 40.180736565559364 31.862876907291625 24.157090106719867 63.91016982497062 39.88400237187715 64.05853692181174 48.19255979497911 32.01124295273492 64 -0.03604891354626716 47.45072431077358"), Phaser.Geom.Polygon.Contains);
		this.setOrigin(0.5, 0.75);

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
