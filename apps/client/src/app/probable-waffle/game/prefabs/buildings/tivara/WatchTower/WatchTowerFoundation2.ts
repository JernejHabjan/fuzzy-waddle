// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class WatchTowerFoundation2 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 64,
      y ?? 147,
      texture || "factions",
      frame ?? "buildings/tivara/watchtower/foundation/foundation_2.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "4.679730980723043 55.46675383144921 62.96255654715912 19.46853804041517 101.98929282310415 50.01161667576024 122.55970184655219 53.78285833005904 123.90254201381228 147.2635427107816 64.01900249388103 176.66401915774185 6.079017077835758 150.26532757765023"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.8364343678972962);

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
