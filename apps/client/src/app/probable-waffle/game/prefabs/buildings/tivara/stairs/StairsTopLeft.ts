// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class StairsTopLeft extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "factions", frame ?? "buildings/tivara/stairs/stairs_top_left.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "0 16 32 0 39.93927126126608 3.9325941130380144 64.28297785980033 40.32136387230537 64.15618772126629 47.80198204581329 32.07828267215606 64.15790991670349 0.2539579001138854 47.80198204581329"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.75);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  // Write your code here.
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
