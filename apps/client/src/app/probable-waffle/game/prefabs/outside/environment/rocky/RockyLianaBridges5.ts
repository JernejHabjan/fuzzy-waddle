
// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class RockyLianaBridges5 extends Phaser.GameObjects.Image {

  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32.24089147370913, y ?? 22.9472867342501, texture || "environment_1", frame ?? "rocky/Liana_bridges5_ground_shadow.png");

    this.setInteractive(new Phaser.Geom.Polygon("21.992139541451195 59.241357035928246 40.540782767182634 53.700853215255215 70.17043363426015 54.90531056757544 100.04097597180171 32.98418675534736 110.15841773129159 39.247364987412524 91.3688830350961 82.36693820047655 20.065007777738828 86.70298466882936"), Phaser.Geom.Polygon.Contains);
    this.setOrigin(0.5018819646383526, 0.5542756776113289);

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
