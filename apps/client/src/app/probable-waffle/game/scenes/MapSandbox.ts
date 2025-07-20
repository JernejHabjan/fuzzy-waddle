// You can write more code here

/* START OF COMPILED CODE */

import GameProbableWaffleScene from "./GameProbableWaffleScene";
import Tree11 from "../prefabs/outside/foliage/trees/resources/Tree11";
import WatchTower from "../prefabs/buildings/tivara/wall/WatchTower";
import EditorOwner from "../editor-components/EditorOwner";
import Stairs from "../prefabs/buildings/tivara/stairs/Stairs";
import Wall from "../prefabs/buildings/tivara/wall/Wall";
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

    // tree11
    const tree11 = new Tree11(this, -160, 416);
    this.add.existing(tree11);

    // watchTower
    const watchTower = new WatchTower(this, -192, 592);
    this.add.existing(watchTower);

    // stairs
    const stairs = new Stairs(this, -224, 624);
    this.add.existing(stairs);

    // stairs_2
    const stairs_2 = new Stairs(this, 32, 752);
    this.add.existing(stairs_2);

    // wall
    const wall = new Wall(this, 0, 768);
    this.add.existing(wall);

    // stairs_1
    const stairs_1 = new Stairs(this, -32, 784);
    this.add.existing(stairs_1);

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
