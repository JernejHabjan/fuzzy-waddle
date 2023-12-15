// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class WatchTower extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 142.47539776925427);

    this.removeInteractive();
    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-64.16304299115464 -102.99372536000635 -47.98693428795153 -110.1853347209513 -40.13719605542049 -107.02200737351342 -39.434234422656516 -113.93446342902583 -32.05313727863481 -118.50371404199166 -24.320559318231098 -114.87174560604446 -23.851918229721782 -121.90136193368419 -16.353660813572738 -126.23629200239534 -8.15244176465972 -123.30728519921213 -8.15244176465972 -130.33690152685188 0.04877728425330474 -134.2031905070537 7.763500092536503 -130.78071633535947 8.232141181045819 -122.57949728644645 15.613238325067528 -126.56294653877563 23.462976557598566 -122.93097810282845 24.28309846248986 -114.49543850966077 31.78135587863892 -118.2445672177353 39.74825438329728 -114.14395769327878 40.216895471806595 -106.29421946074774 48.41811452071961 -110.1605084409496 63.766110169399695 -102.54509075267322 64.09973583366116 -78.80902680567434 60.2334468534593 -76.58298163525508 60.476042824381196 -59.80902630377199 58.4843181982166 -59.45754548738999 58.174081611723054 4.226407461799909 -0.2018238858371788 33.523678385669086 -56.61000223179427 4.882316512334285 -56.0525841172623 -58.560373362300496 -60.16410754368119 -60.23854618941024 -60.25491984800737 -76.81900354865053 -64.037712371975 -78.85458661580148"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_tivara_watchtower
    const buildings_tivara_watchtower = scene.add.image(
      0,
      -32.622093200683594,
      "factions",
      "buildings/tivara/watchtower.png"
    );
    buildings_tivara_watchtower.setOrigin(0.5, 0.6241665097251005);
    this.add(buildings_tivara_watchtower);

    // this (prefab fields)
    this.z = 0;

    /* START-USER-CTR-CODE */
    this.on("pointerdown", () => {
      buildings_tivara_watchtower.setTint(0xff0000); // Tint to red
      // tint back to transparent after 1 second
      setTimeout(() => {
        buildings_tivara_watchtower.clearTint();
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