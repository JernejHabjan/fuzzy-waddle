// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { setActorData } from "../../../../data/actor-data";
import { OwnerComponent } from "../../../../entity/actor/components/owner-component";
import { SelectableComponent } from "../../../../entity/actor/components/selectable-component";
import { HealthComponent, HealthDefinition } from "../../../../entity/combat/components/health-component";
/* END-USER-IMPORTS */

export default class WallTopRightBottomRight extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 32,
      y ?? 79.55822689351446,
      texture || "factions",
      frame ?? "buildings/tivara/wall/wall_top_right_bottom_right.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-0.1733365867294907 22.453911963264424 9.54880703645658 17.848686036492076 15.337278097787955 20.298045378341925 16.43441600297237 30.817661763345434 23.66261867242264 26.364572618773394 24.21730440247932 11.878948737173886 32.23380878354795 7.103158893132999 39.45262916123531 10.94294126016807 40.11968725018887 19.07183242548875 41.60405029837955 19.329982520826263 47.72655261989959 15.34394637465671 64 24 64.12926238482102 79.5928261687536 32.16365856448874 96.00000000000001 -0.0027726637280309774 79.93395401475652"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.8287315301407756);

    /* START-USER-CTR-CODE */
    setActorData(
      this,
      [
        new OwnerComponent(this),
        new SelectableComponent(this),
        new HealthComponent(this, {
          maxHealth: 100
        } satisfies HealthDefinition)
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
