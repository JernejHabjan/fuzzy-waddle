// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { setActorData } from "../../../../data/actor-data";
import { WalkableComponent, type WalkableDefinition } from "../../../../entity/components/walkable-component";
import {
  ObjectDescriptorComponent,
  type ObjectDescriptorDefinition
} from "../../../../entity/components/object-descriptor-component";
/* END-USER-IMPORTS */

export default class BridgeStone extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 160, y ?? 96, texture || "outside", frame ?? "architecture/river/bridge_stone.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "76.20450677413014 103.3684282381837 188.70588473344927 47.26014606606756 224.59240023439665 46.97533245098068 269.5929514181243 71.4693033484527 89.3059330681268 171.15406862886206 35.19134620161887 145.5208432710425"
      ),
      Phaser.Geom.Polygon.Contains
    );

    /* START-USER-CTR-CODE */
    const walkableComponent = new WalkableComponent(this, { shrinkPathToRight: 4 } satisfies WalkableDefinition);
    // TODO #387 - until this is properly implemented, we are marking the bridge as walkable from all sides
    walkableComponent.allowWalkablePath({
      bottomLeft: true,
      topRight: true,
      bottom: true,
      bottomRight: true,
      left: true,
      right: true,
      top: true,
      topLeft: true
    });
    setActorData(
      this,
      [
        new ObjectDescriptorComponent({
          color: 0x97a09e
        } satisfies ObjectDescriptorDefinition),
        walkableComponent
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
