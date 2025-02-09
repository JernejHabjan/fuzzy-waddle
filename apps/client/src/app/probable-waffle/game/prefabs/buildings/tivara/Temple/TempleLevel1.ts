// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class TempleLevel1 extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 96, y ?? 132);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-87.4233523303501 -76.75060092556245 -16.50738820893966 -110.3423734041253 -8.36392821413655 -103.21684590867258 0.11884261378335736 -107.28857590607413 10.298167607287255 -101.52029174308859 19.459560101440744 -108.98513007165812 87.32172672479999 -74.71473592686168 87.66103755791679 10.791594018571004 0.45815344690015536 53.544758991287324 -89.11990649593407 9.095039852987014"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_tivara_temple
    const buildings_tivara_temple = scene.add.image(
      -0.30766778687379315,
      -36.666560409786456,
      "factions",
      "buildings/tivara/temple/temple.png"
    );
    this.add(buildings_tivara_temple);

    // buildings_tivara_temple_temple_olival
    const buildings_tivara_temple_temple_olival = scene.add.image(
      -2,
      -13,
      "factions",
      "buildings/tivara/temple/temple-olival.png"
    );
    this.add(buildings_tivara_temple_temple_olival);

    this.buildings_tivara_temple_temple_olival = buildings_tivara_temple_temple_olival;

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  private buildings_tivara_temple_temple_olival: Phaser.GameObjects.Image;

  /* START-USER-CODE */

  // todo private addGlow = (scene: Phaser.Scene, image: Phaser.GameObjects.Image) => {
  // todo   // https://labs.phaser.io/view.html?src=src\fx\glow\glow%20fx.js
  // todo   if (!image.preFX) return;
  // todo   image.preFX.setPadding(32);
  // todo   const fx = image.preFX.addGlow();
  // todo   //  For PreFX Glow the quality and distance are set in the Game Configuration
  // todo   scene.tweens.add({
  // todo     targets: fx,
  // todo     outerStrength: 1,
  // todo     yoyo: true,
  // todo     loop: -1,
  // todo     ease: "sine.inout"
  // todo   });
  // todo };
  private bounce = (image: Phaser.GameObjects.Image) => {
    // bounce the sprite up and down forever with a 2 seconds duration
    this.scene.tweens.add({
      targets: image,
      y: "-=4", // move up by 4
      duration: 1000, // takes 1000ms
      ease: "Sine.InOut",
      yoyo: true, // reverse the animation after it completes
      loop: -1 // loop indefinitely
    });
  };

  /* END-USER-CODE */
  start() {
    this.bounce(this.buildings_tivara_temple_temple_olival);
    // todo setTimeout(() => {
    // todo   this.addGlow(scene, buildings_tivara_temple_temple_olival);
    // todo }, 1000);
  }
}

/* END OF COMPILED CODE */

// You can write more code here
