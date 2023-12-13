// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class WallTopLeftBottomLeft extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 80);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-31.939658255880616 -57.70914236361682 -23.9815040823515 -62.00671238286718 -15.510591137887129 -56.48896174931699 -8.205400158257305 -60.45241642975445 -8.438544551224215 -66.90274463517227 0.8026559631372194 -71.8222088373314 8.270136944737615 -67.67989261172863 8.270136944737615 -54.62380660558172 15.575327924367436 -51.12664071107808 15.963901912645618 -55.63409897510499 23.890811273520534 -59.90841284616499 32 -56 32.03957642495884 0.8130399473863292 0.04995908453911113 16.055151738998077 -32.12783247553015 1.1893883866853798"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_tivara_wall_top_left_bottom_left
    const buildings_tivara_wall_top_left_bottom_left = scene.add.image(
      0,
      -47.96466252248314,
      "factions",
      "buildings/tivara/wall/wall_top_left_bottom_left.png"
    );
    buildings_tivara_wall_top_left_bottom_left.setOrigin(0.5, 0.3334822468676007);
    this.add(buildings_tivara_wall_top_left_bottom_left);

    /* START-USER-CTR-CODE */
    this.on("pointerdown", () => {
      buildings_tivara_wall_top_left_bottom_left.setTint(0xff0000); // Tint to red
    });
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
