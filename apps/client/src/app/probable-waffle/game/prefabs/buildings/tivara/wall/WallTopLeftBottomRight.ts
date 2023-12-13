// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class WallTopLeftBottomRight extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 80);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-31.96027388081808 -47.997131230678576 -24.311540340751524 -52.246427641826656 -24.16989712704659 -59.0453018996636 -15.388017877340545 -63.719527951926494 -8.305857192093733 -60.17844760930309 -8.164213978388798 -67.40225150825484 0.3343788439073734 -71.79319113310785 8.549685238793678 -66.69403543973016 8.549685238793678 -52.10478442812172 15.773489137745422 -47.85548801697364 16.0567755651553 -55.22093512963032 23.70550910522185 -59.895161181893215 32 -56 31.920815500108148 0.8697774975244243 0.1927356302024421 16.025601363952603 -31.818630667113144 0.728134283819486"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_tivara_wall_top_left_bottom_right
    const buildings_tivara_wall_top_left_bottom_right = scene.add.image(
      0,
      -47.96466252248314,
      "factions",
      "buildings/tivara/wall/wall_top_left_bottom_right.png"
    );
    buildings_tivara_wall_top_left_bottom_right.setOrigin(0.5, 0.3334822468676007);
    this.add(buildings_tivara_wall_top_left_bottom_right);

    /* START-USER-CTR-CODE */
    this.on("pointerdown", () => {
      buildings_tivara_wall_top_left_bottom_right.setTint(0xff0000); // Tint to red
      // tint back to transparent after 1 second
      setTimeout(() => {
        buildings_tivara_wall_top_left_bottom_right.clearTint();
      }, 1000);
    });
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
