// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class WatchTowerFoundation1 extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 64,
      y ?? 147,
      texture || "factions",
      frame ?? "buildings/tivara/watchtower/foundation/foundation_1.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "4.5662169405003965 131.89114350882707 62.99993347253282 93.32489059768568 124.16055677606009 128.38512051690515 123.77099866584653 149.03170035822325 69.38822128889754 177.73443774503585 5.29334778381407 149.5326934027991"
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
