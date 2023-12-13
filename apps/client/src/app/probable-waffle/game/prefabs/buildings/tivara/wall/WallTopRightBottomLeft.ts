// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class WallTopRightBottomLeft extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 80);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-32.05383086082167 -57.60603448466193 -23.55073783472507 -61.4710767692513 -15.202246500012045 -56.83302602774406 -15.202246500012045 -50.03055160686678 -8.708975461901915 -53.27718712592184 -8.090568696367615 -68.42815288151215 0.10332094696183702 -72.60239854886866 8.761015664442013 -68.118949498745 8.606413973058437 -61.31647507786772 16.027295159470015 -65.18151736245709 23.91198142003232 -60.388864929566274 23.91198142003232 -52.9679837431547 31.951269371978192 -48.32993300164746 31.951269371978192 0.8334048583292457 0.25792263834541274 16.293573996686703 -31.899229169438094 0.5242014755620943"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_tivara_wall_top_right_bottom_left
    const buildings_tivara_wall_top_right_bottom_left = scene.add.image(
      0,
      -47.96466252248314,
      "factions",
      "buildings/tivara/wall/wall_top_right_bottom_left.png"
    );
    buildings_tivara_wall_top_right_bottom_left.setOrigin(0.5, 0.3334822468676007);
    this.add(buildings_tivara_wall_top_right_bottom_left);

    /* START-USER-CTR-CODE */
    this.on("pointerdown", () => {
      buildings_tivara_wall_top_right_bottom_left.setTint(0xff0000); // Tint to red
      // tint back to transparent after 1 second
      setTimeout(() => {
        buildings_tivara_wall_top_right_bottom_left.clearTint();
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
