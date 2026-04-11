
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RockyDragonBonesFull extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 28.85103046096951, y ?? -34.3980362712977, texture || "environment_1", frame ?? "rocky/Dragon_bones_full_ground_shadow.png");

    this.setInteractive(new Phaser.Geom.Polygon("9.575388776945815 110.69733575477635 69.93063696054479 70.28556088401875 167.02386229937798 33.022755483709815 219.50668680685538 56.64002651207464 197.9887287587897 88.65454946163585 236.82601889432289 123.29321363657091 199.03838524893916 158.98153430165553 162.30040809370502 204.64159162316088 98.79619043965737 221.96092371062844"), Phaser.Geom.Polygon.Contains);
    this.setOrigin(0.48769933773816215, 0.42813267081524337);

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
