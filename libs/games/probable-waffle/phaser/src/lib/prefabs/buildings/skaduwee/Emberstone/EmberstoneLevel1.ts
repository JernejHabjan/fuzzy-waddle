// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { TileMapTintComponent } from "../../../../entity/components/construction/tile-map-tint.component";
/* END-USER-IMPORTS */

export default class EmberstoneLevel1 extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 96.44864925818341);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-24.402698920542555 -66.32343174744562 0.16862688641111845 -81.86881142737215 23.57192387826992 -65.70837248079418 21.93176583386608 -7.687781660008142 31.157654833637707 -3.5873865489985235 31.88592104464726 2.8076344446160846 0.4596112364866798 19.684726748998614 -32.42162032205171 3.098618794691646 -31.78341012035986 -3.7924063045490044 -22.55752112058823 -6.252643371154775"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_skaduwee_ember_stone_ember_stone
    const buildings_skaduwee_ember_stone_ember_stone = scene.add.sprite(
      0,
      -32.44865158816356,
      "factions",
      "buildings/skaduwee/ember_stone/ember_stone1.png"
    );
    buildings_skaduwee_ember_stone_ember_stone.play("buildings/skaduwee/ember_stone/ember_stone");
    this.add(buildings_skaduwee_ember_stone_ember_stone);

    /* START-USER-CTR-CODE */
    this.tileMapTintComponent = new TileMapTintComponent(0xb5f5fa, 6);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  private tileMapTintComponent: TileMapTintComponent;
  private init() {
    this.tileMapTintComponent.init(this.parentContainer);
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
