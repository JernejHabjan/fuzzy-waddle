// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class StairsBottomRight extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 48, texture || "factions", frame ?? "buildings/tivara/stairs/stairs_bottom_right.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "0.6470042799160751 41.01427423104676 56.535683479569855 10.699335127892653 63.862991035308525 13.860134465662277 64.28297785980033 40.32136387230537 64.15618772126629 47.80198204581329 32.07828267215606 64.15790991670349 0.2539579001138854 47.80198204581329"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.75);

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
