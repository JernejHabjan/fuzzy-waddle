// You can write more code here

/* START OF COMPILED CODE */

import GameProbableWaffleScene from "./GameProbableWaffleScene";
import TivaraWorkerMale from "../prefabs/characters/tivara/TivaraWorkerMale";
import EditorOwner from "../editor-components/EditorOwner";
import Tree11 from "../prefabs/outside/foliage/trees/resources/Tree11";
import WatchTower from "../prefabs/buildings/tivara/wall/WatchTower";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class MapSandbox extends GameProbableWaffleScene {

  constructor() {
    super("MapSandbox");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {

    // tilemap
    const tilemap = this.add.tilemap("tiles_river_crossing");
    tilemap.addTilesetImage("tiles", "tiles_1");
    tilemap.addTilesetImage("tiles_2", "tiles_2");

    // tilemap_level_1
    tilemap.createLayer("TileMap_level_1", ["tiles","tiles_2"], 0, 0);

    // tivaraWorkerMale
    const tivaraWorkerMale = new TivaraWorkerMale(this, 40, 650);
    this.add.existing(tivaraWorkerMale);

    // tree11
    const tree11 = new Tree11(this, -160, 416);
    this.add.existing(tree11);

    // watchTower
    const watchTower = new WatchTower(this, -192, 592);
    this.add.existing(watchTower);

    // tivaraWorkerMale (components)
    const tivaraWorkerMaleEditorOwner = new EditorOwner(tivaraWorkerMale);
    tivaraWorkerMaleEditorOwner.owner_id = "1";

    // watchTower (components)
    const watchTowerEditorOwner = new EditorOwner(watchTower);
    watchTowerEditorOwner.owner_id = "1";

    this.tilemap = tilemap;

    this.events.emit("scene-awake");
  }

  public tilemap!: Phaser.Tilemaps.Tilemap;

  /* START-USER-CODE */
  create() {
    this.editorCreate();

    super.create();
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
