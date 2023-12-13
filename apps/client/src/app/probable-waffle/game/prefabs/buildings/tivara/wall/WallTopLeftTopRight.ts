// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class WallTopLeftTopRight extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 80);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-31.975256415175014 -49.1416880610122 -24.641007726112225 -52.21183867503849 -23.958752034106382 -59.8872152101042 -15.60111980703483 -63.98074936213925 -8.949126809977884 -60.39890697910859 -8.607998963974964 -67.22146389916699 -0.07980281390195287 -71.99725374320788 7.291308953442197 -68.32149719333754 7.25444587516084 -61.08116267111443 13.906438872217784 -65.34526074615093 24.651966021309782 -59.8872152101042 24.140274252305403 -52.72353044404287 31.986214710372572 -48.62999629200783 32.15677863337403 0.49241353241271213 0.0907611090995104 16.013730525545583 -32.14582033817648 0.8335413784156316"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_tivara_wall_top_left_top_right
    const buildings_tivara_wall_top_left_top_right = scene.add.image(
      0,
      -47.96466252248314,
      "factions",
      "buildings/tivara/wall/wall_top_left_top_right.png"
    );
    buildings_tivara_wall_top_left_top_right.setOrigin(0.5, 0.3334822468676007);
    this.add(buildings_tivara_wall_top_left_top_right);

    /* START-USER-CTR-CODE */
    this.on("pointerdown", () => {
      buildings_tivara_wall_top_left_top_right.setTint(0xff0000); // Tint to red
    });
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
