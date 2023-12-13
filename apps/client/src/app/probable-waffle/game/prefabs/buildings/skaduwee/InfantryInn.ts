// You can write more code here

/* START OF COMPILED CODE */

import ActorContainer from "../../../entity/actor/ActorContainer";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class InfantryInn extends ActorContainer {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 128);

    this.removeInteractive();
    this.setInteractive(new Phaser.Geom.Circle(0, -35, 59.91620797027979), Phaser.Geom.Circle.Contains);

    // infantry_inn_building
    const infantry_inn_building = scene.add.image(
      -0.16910280030724323,
      -31.74029716298027,
      "factions",
      "buildings/skaduwee/infantry_inn/infantry_inn.png"
    );
    this.add(infantry_inn_building);

    // cloud_1
    const cloud_1 = scene.add.image(24, -82, "factions", "buildings/skaduwee/infantry_inn/cloud-vertical.png");
    this.add(cloud_1);

    // cloud_2
    const cloud_2 = scene.add.image(13, -110, "factions", "buildings/skaduwee/infantry_inn/cloud-vertical.png");
    this.add(cloud_2);

    // skaduwee_buildings_infantry_inn_entrance
    const skaduwee_buildings_infantry_inn_entrance = scene.add.sprite(
      24,
      -8,
      "factions",
      "buildings/skaduwee/infantry_inn/infantry_inn-entrance/infantry_inn-0.png"
    );
    skaduwee_buildings_infantry_inn_entrance.play("skaduwee-buildings-infantry-inn-entrance");
    this.add(skaduwee_buildings_infantry_inn_entrance);

    /* START-USER-CTR-CODE */
    this.cloud1 = cloud_1;
    this.cloud2 = cloud_2;
    this.setupCloudsTween(this.cloud1);
    this.setupCloudsTween(this.cloud2);

    this.on("pointerdown", () => {
      infantry_inn_building.setTint(0xff0000); // Tint to red
      // tint back to transparent after 1 second
      setTimeout(() => {
        infantry_inn_building.clearTint();
      }, 1000);
    });
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  private readonly cloud1: Phaser.GameObjects.Image;
  private readonly cloud2: Phaser.GameObjects.Image;

  private setupCloudsTween(cloud: Phaser.GameObjects.Image) {
    // Moving up and disappearing
    this.scene.tweens.add({
      targets: cloud,
      y: -128,
      alpha: 0,
      duration: 3000,
      onComplete: () => {
        // Waiting for 2-4 seconds
        this.scene.time.delayedCall(Phaser.Math.Between(1000, 8000), () => {
          // Re-appearing and setting down
          cloud.y = -80;
          this.scene.tweens.add({
            targets: cloud,
            y: -100,
            alpha: 1,
            duration: 1000,
            onComplete: () => {
              // Setting up the next upward movement
              this.setupCloudsTween(cloud);
            }
          });
        });
      }
    });
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
