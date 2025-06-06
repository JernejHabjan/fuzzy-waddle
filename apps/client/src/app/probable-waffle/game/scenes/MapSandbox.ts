// You can write more code here

/* START OF COMPILED CODE */

import GameProbableWaffleScene from "./GameProbableWaffleScene";
import TivaraWorkerMale from "../prefabs/characters/tivara/TivaraWorkerMale";
import EditorOwner from "../editor-components/EditorOwner";
import WorkMill from "../prefabs/buildings/tivara/WorkMill";
import Tree11 from "../prefabs/outside/foliage/trees/resources/Tree11";
import TivaraSlingshotFemale from "../prefabs/characters/tivara/TivaraSlingshotFemale";
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

    // tivaraWorkerMale
    const tivaraWorkerMale = new TivaraWorkerMale(this, 40, 650);
    this.add.existing(tivaraWorkerMale);

    // workMill
    const workMill = new WorkMill(this, 448, 736);
    this.add.existing(workMill);

    // tree11
    const tree11 = new Tree11(this, -160, 416);
    this.add.existing(tree11);

    // workMill_1
    const workMill_1 = new WorkMill(this, -352, 576);
    this.add.existing(workMill_1);

    // tivaraSlingshotFemale
    const tivaraSlingshotFemale = new TivaraSlingshotFemale(this, 224, 560);
    this.add.existing(tivaraSlingshotFemale);

    // tivaraWorkerMale (components)
    const tivaraWorkerMaleEditorOwner = new EditorOwner(tivaraWorkerMale);
    tivaraWorkerMaleEditorOwner.owner_id = "1";

    // workMill (components)
    const workMillEditorOwner = new EditorOwner(workMill);
    workMillEditorOwner.owner_id = "2";

    // workMill_1 (components)
    const workMill_1EditorOwner = new EditorOwner(workMill_1);
    workMill_1EditorOwner.owner_id = "1";

    // tivaraSlingshotFemale (components)
    const tivaraSlingshotFemaleEditorOwner = new EditorOwner(tivaraSlingshotFemale);
    tivaraSlingshotFemaleEditorOwner.owner_id = "1";

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
