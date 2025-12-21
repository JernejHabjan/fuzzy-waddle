// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { TileMapTintComponent } from "../../../../entity/components/construction/tile-map-tint.component";
/* END-USER-IMPORTS */

export default class EmberstoneLevel1 extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 32,
      y ?? 95.90208743516723,
      texture || "factions",
      frame ?? "buildings/skaduwee/ember_stone/ember_stone1.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "9.788372063149147 27.988150775023485 33.51043684446447 14.491113916688903 55.596497158102885 27.17014854118503 55.05050388928409 88.43623088666114 64.04852846150715 97.84325657580341 32.14644134180722 115.83930572024953 0.2443542221072903 97.84325657580341 8.833377677411114 88.43623088666114"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.749235058087244);
    this.play("buildings/skaduwee/ember_stone/ember_stone");

    /* START-USER-CTR-CODE */
    this.tileMapTintComponent = new TileMapTintComponent(0xb5f5fa, 6);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  private tileMapTintComponent: TileMapTintComponent;
  private init() {
    this.tileMapTintComponent.tintTilemapAroundTransform(this.parentContainer);
  }

  start() {
    this.init();
  }

  override destroy(fromScene?: boolean) {
    super.destroy(fromScene);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
