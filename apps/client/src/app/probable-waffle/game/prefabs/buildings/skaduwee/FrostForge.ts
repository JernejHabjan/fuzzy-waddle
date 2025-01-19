// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { setActorDataFromName } from "../../../data/actor-data";
import { ObjectNames } from "../../../data/object-names";
/* END-USER-IMPORTS */

export default class FrostForge extends Phaser.GameObjects.Container {

	constructor(scene: Phaser.Scene, x?: number, y?: number) {
		super(scene, x ?? 129, y ?? 323.7847134131514);

		this.setInteractive(new Phaser.Geom.Polygon("-68.7545786628312 -214.43394506509725 -38.690327299456825 -228.69121890752223 -0.2576760720504012 -233.34032994309558 43.44396766233913 -227.14151522899778 69.16904872584504 -214.74388580080216 71.27223590831247 -192.47146282907468 60.98195252153286 -182.48068661227393 62.22171546435243 -148.38720568473596 69.97023385697469 -142.18839097063815 75.4034707557831 -79.55104366487666 85.32112237919412 -46.381415218517645 96.47898886457017 -37.703074618780704 106.60762571945156 11.039650145841563 74.37378920614296 32.73550164518389 36.251078714441434 42.65360518774037 6.371750760001362 44.99389139705903 -37.82475711902734 42.96354592344528 -76.25740834643375 32.73550164518389 -106.16641807554313 10.997986227988292 -98.7969319792297 -38.23869519017006 -87.09176657806283 -49.2553214500918 -75.38660117689597 -80.92812194736686 -73.32098375316063 -142.20810551818164 -65.05851405821932 -148.40495778938765 -60.82475661048905 -182.48068661227393 -70.74286015304554 -192.08884941912552"), Phaser.Geom.Polygon.Contains);

		// buildings_skaduwee_frost_forge_frost_forge_png
		const buildings_skaduwee_frost_forge_frost_forge_png = scene.add.image(-1, -18.21845166634691, "factions", "buildings/skaduwee/frost_forge/frost_forge.png");
		buildings_skaduwee_frost_forge_frost_forge_png.setOrigin(0.5, 0.7957454759361422);
		this.add(buildings_skaduwee_frost_forge_frost_forge_png);

		// frost_forge_flame
		const frost_forge_flame = scene.add.sprite(2, -235, "factions", "buildings/skaduwee/frost_forge/flame/frost_forge_flame_1.png");
		frost_forge_flame.scaleX = 1.5;
		frost_forge_flame.scaleY = 2;
		frost_forge_flame.setOrigin(0.5, 0.5151570341464229);
		frost_forge_flame.play("frost_forge_flame");
		this.add(frost_forge_flame);

		// cloud_3
		const cloud_3 = scene.add.image(-25, -215, "factions", "buildings/skaduwee/infantry_inn/cloud-vertical.png");
		cloud_3.scaleX = 2;
		cloud_3.scaleY = 2;
		cloud_3.angle = -180;
		this.add(cloud_3);

		// cloud_2
		const cloud_2 = scene.add.image(26, -232, "factions", "buildings/skaduwee/infantry_inn/cloud-vertical.png");
		cloud_2.scaleX = 2;
		cloud_2.scaleY = 2;
		this.add(cloud_2);

		// cloud_1
		const cloud_1 = scene.add.image(2, -250, "factions", "buildings/skaduwee/infantry_inn/cloud-vertical.png");
		cloud_1.scaleX = 2.2;
		cloud_1.scaleY = 2.2;
		cloud_1.angle = -180;
		this.add(cloud_1);

		this.cloud_3 = cloud_3;
		this.cloud_2 = cloud_2;
		this.cloud_1 = cloud_1;

		/* START-USER-CTR-CODE */
    setActorDataFromName(this);

    this.setupCloudsTween(this.cloud_1);
    this.setupCloudsTween(this.cloud_2);
    this.setupCloudsTween(this.cloud_3);
    /* END-USER-CTR-CODE */
	}

	private cloud_3: Phaser.GameObjects.Image;
	private cloud_2: Phaser.GameObjects.Image;
	private cloud_1: Phaser.GameObjects.Image;

	/* START-USER-CODE */
  name = ObjectNames.FrostForge;
  private tweens: Phaser.Tweens.Tween[] = [];
  private setupCloudsTween(cloud: Phaser.GameObjects.Image) {
    cloud.alpha = 0;
    cloud.y = -215;
    // Waiting for 2-4 seconds, then appear it in 1 second
    this.scene.time.delayedCall(Phaser.Math.Between(1000, 8000), () => {
      this.moveAndFade(cloud);
    });
  }

  private moveAndFade(cloud: Phaser.GameObjects.Image) {
    if (!this.active) return;
    // Moving up and disappearing
    this.tweens.push(
      this.scene.tweens.add({
        targets: cloud,
        y: -300,
        alpha: 0,
        duration: 2000,
        onComplete: () => {
          if (!this.active) return;
          // Waiting for 2-4 seconds
          this.scene.time.delayedCall(Phaser.Math.Between(1000, 8000), () => {
            if (!this.active) return;
            // Re-appearing and setting down
            cloud.y = -215;
            this.scene.tweens.add({
              targets: cloud,
              y: -275,
              alpha: 1,
              duration: 3000,
              onComplete: () => {
                // Setting up the next upward movement
                this.moveAndFade(cloud);
              }
            });
          });
        }
      })
    );
  }

  override destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.tweens.forEach((t) => t.destroy());
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
