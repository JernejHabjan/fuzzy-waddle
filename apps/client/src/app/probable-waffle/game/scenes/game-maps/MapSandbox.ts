// You can write more code here

/* START OF COMPILED CODE */

import GameProbableWaffleScene from "../GameProbableWaffleScene";
import Tree11 from "../../prefabs/outside/foliage/trees/resources/Tree11";
import WatchTower from "../../prefabs/buildings/tivara/wall/WatchTower";
import EditorOwner from "../../editor-components/EditorOwner";
import Stairs from "../../prefabs/buildings/tivara/stairs/Stairs";
import Wall from "../../prefabs/buildings/tivara/wall/Wall";
import TivaraWorkerMale from "../../prefabs/characters/tivara/tivara-worker/tivara-worker-male/TivaraWorkerMale";
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
    tilemap.createLayer("TileMap_level_1", ["tiles", "tiles_2"], 0, 0);

    // tree11
    const tree11 = new Tree11(this, -160, 416);
    this.add.existing(tree11);

    // watchTower
    const watchTower = new WatchTower(this, -192, 592);
    this.add.existing(watchTower);

    // stairs
    const stairs = new Stairs(this, -160, 624);
    this.add.existing(stairs);

    // stairs_2
    const stairs_2 = new Stairs(this, 32, 752);
    this.add.existing(stairs_2);

    // wall
    const wall = new Wall(this, 0, 768);
    this.add.existing(wall);

    // tivaraWorkerMale
    const tivaraWorkerMale = new TivaraWorkerMale(this, 108, 786);
    this.add.existing(tivaraWorkerMale);

    // wall_1
    const wall_1 = new Wall(this, -32, 784);
    this.add.existing(wall_1);

    // wall_2
    const wall_2 = new Wall(this, -64, 800);
    this.add.existing(wall_2);

    // stairs_1
    const stairs_1 = new Stairs(this, -96, 816);
    this.add.existing(stairs_1);

    // watchTower (components)
    const watchTowerEditorOwner = new EditorOwner(watchTower);
    watchTowerEditorOwner.owner_id = "1";

    // stairs (components)
    const stairsEditorOwner = new EditorOwner(stairs);
    stairsEditorOwner.owner_id = "1";

    // stairs_2 (components)
    const stairs_2EditorOwner = new EditorOwner(stairs_2);
    stairs_2EditorOwner.owner_id = "1";

    // wall (components)
    const wallEditorOwner = new EditorOwner(wall);
    wallEditorOwner.owner_id = "1";

    // tivaraWorkerMale (components)
    const tivaraWorkerMaleEditorOwner = new EditorOwner(tivaraWorkerMale);
    tivaraWorkerMaleEditorOwner.owner_id = "1";

    // wall_1 (components)
    const wall_1EditorOwner = new EditorOwner(wall_1);
    wall_1EditorOwner.owner_id = "1";

    // wall_2 (components)
    const wall_2EditorOwner = new EditorOwner(wall_2);
    wall_2EditorOwner.owner_id = "1";

    // stairs_1 (components)
    const stairs_1EditorOwner = new EditorOwner(stairs_1);
    stairs_1EditorOwner.owner_id = "1";

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
