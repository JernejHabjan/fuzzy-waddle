// You can write more code here
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

/* START OF COMPILED CODE */

import GameProbableWaffleScene from "../GameProbableWaffleScene";
import Tree11 from "../../../prefabs/outside/foliage/trees/resources/Tree11";
import WatchTower from "../../../prefabs/buildings/tivara/wall/WatchTower";
import EditorOwner from "../editor-components/EditorOwner";
import Stairs from "../../../prefabs/buildings/tivara/stairs/Stairs";
import Wall from "../../../prefabs/buildings/tivara/wall/Wall";
import TivaraWorkerMale from "../../../prefabs/characters/tivara/tivara-worker/tivara-worker-male/TivaraWorkerMale";
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
    const stairs = new Stairs(this, -144, 616);
    this.add.existing(stairs);

    // stairs_2
    const stairs_2 = new Stairs(this, 160, 688);
    this.add.existing(stairs_2);

    // wall
    const wall = new Wall(this, 128, 704);
    this.add.existing(wall);

    // tivaraWorkerMale
    const tivaraWorkerMale = new TivaraWorkerMale(this, -16, 784);
    this.add.existing(tivaraWorkerMale);

    // wall_1
    const wall_1 = new Wall(this, 96, 720);
    this.add.existing(wall_1);

    // wall_2
    const wall_2 = new Wall(this, 64, 736);
    this.add.existing(wall_2);

    // wall_3
    const wall_3 = new Wall(this, 224, 648);
    this.add.existing(wall_3);

    // wall_4
    const wall_4 = new Wall(this, 256, 664);
    this.add.existing(wall_4);

    // watchTower_1
    const watchTower_1 = new WatchTower(this, 448, 728);
    this.add.existing(watchTower_1);

    // wall_5
    const wall_5 = new Wall(this, 496, 752);
    this.add.existing(wall_5);

    // stairs_3
    const stairs_3 = new Stairs(this, 528, 768);
    this.add.existing(stairs_3);

    // stairs_4
    const stairs_4 = new Stairs(this, 64, 576);
    this.add.existing(stairs_4);

    // stairs_5
    const stairs_5 = new Stairs(this, 32, 560);
    this.add.existing(stairs_5);

    // stairs_1
    const stairs_1 = new Stairs(this, 32, 752);
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

    // wall_3 (components)
    const wall_3EditorOwner = new EditorOwner(wall_3);
    wall_3EditorOwner.owner_id = "1";

    // wall_4 (components)
    const wall_4EditorOwner = new EditorOwner(wall_4);
    wall_4EditorOwner.owner_id = "1";

    // watchTower_1 (components)
    const watchTower_1EditorOwner = new EditorOwner(watchTower_1);
    watchTower_1EditorOwner.owner_id = "1";

    // wall_5 (components)
    const wall_5EditorOwner = new EditorOwner(wall_5);
    wall_5EditorOwner.owner_id = "1";

    // stairs_3 (components)
    const stairs_3EditorOwner = new EditorOwner(stairs_3);
    stairs_3EditorOwner.owner_id = "1";

    // stairs_4 (components)
    const stairs_4EditorOwner = new EditorOwner(stairs_4);
    stairs_4EditorOwner.owner_id = "1";

    // stairs_5 (components)
    const stairs_5EditorOwner = new EditorOwner(stairs_5);
    stairs_5EditorOwner.owner_id = "1";

    // stairs_1 (components)
    const stairs_1EditorOwner = new EditorOwner(stairs_1);
    stairs_1EditorOwner.owner_id = "1";

    this.tilemap = tilemap;

    this.events.emit("scene-awake");
  }

  public tilemap!: Phaser.Tilemaps.Tilemap;

  /* START-USER-CODE */
  override create() {
    this.editorCreate();

    super.create();
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
