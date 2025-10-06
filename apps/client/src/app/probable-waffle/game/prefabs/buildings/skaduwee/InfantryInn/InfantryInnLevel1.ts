// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ANIM_SKADUWEE_BUILDINGS_INFANTRY_INN_ENTRANCE } from "./anims-infantry-inn";
/* END-USER-IMPORTS */

export default class InfantryInnLevel1 extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 128);

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

    this.cloud_1 = cloud_1;
    this.cloud_2 = cloud_2;
    this.skaduwee_buildings_infantry_inn_entrance = skaduwee_buildings_infantry_inn_entrance;

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  private cloud_1: Phaser.GameObjects.Image;
  private cloud_2: Phaser.GameObjects.Image;
  private skaduwee_buildings_infantry_inn_entrance: Phaser.GameObjects.Sprite;

  /* START-USER-CODE */
  private readonly tweens: Phaser.Tweens.Tween[] = [];

  start() {
    this.setupCloudsTween(this.cloud_1);
    this.setupCloudsTween(this.cloud_2);
    this.skaduwee_buildings_infantry_inn_entrance.play(ANIM_SKADUWEE_BUILDINGS_INFANTRY_INN_ENTRANCE);
  }
  private setupCloudsTween(cloud: Phaser.GameObjects.Image) {
    if (!this.active) return;
    // Moving up and disappearing
    this.tweens.push(
      this.scene.tweens.add({
        targets: cloud,
        y: -128,
        alpha: 0,
        duration: 3000,
        onComplete: () => {
          if (!this.active) return;
          // Waiting for 2-4 seconds
          this.scene.time.delayedCall(Phaser.Math.Between(1000, 8000), () => {
            if (!this.active) return;
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
      })
    );
  }

  override destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.tweens.forEach((tween) => tween.destroy());
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
