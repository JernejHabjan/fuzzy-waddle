// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class EmberstoneFoundation1 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 32,
      y ?? 94.99635088693671,
      texture || "factions",
      frame ?? "buildings/skaduwee/ember_stone/foundation/foundation_1.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "5.079261247023986 87.94931847019735 24.963712896279517 80.34643989842318 31.396917841626895 39.992699786698736 42.50881729268146 75.0829085795026 64.14777938157718 91.45833934947775 33.15142828126709 117.19115913086726 1.5702403677435974 101.40056517410551"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.742158991304193);

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
