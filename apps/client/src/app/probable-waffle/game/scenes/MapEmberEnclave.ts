// You can write more code here

/* START OF COMPILED CODE */

import BlockObsidianLava5 from "../prefabs/outside/nature/block_obsidian_lava/BlockObsidianLava5";
import BushDownwardsLarge from "../prefabs/outside/foliage/bushes/BushDownwardsLarge";
import BlockObsidianLava4 from "../prefabs/outside/nature/block_obsidian_lava/BlockObsidianLava4";
import Tree6 from "../prefabs/outside/foliage/trees/resources/Tree6";
import BushUpwardsLarge from "../prefabs/outside/foliage/bushes/BushUpwardsLarge";
import BushDownwardsSmall from "../prefabs/outside/foliage/bushes/BushDownwardsSmall";
import BlockStoneWater4 from "../prefabs/outside/nature/block_stone_water/BlockStoneWater4";
import AnkGuard from "../prefabs/buildings/tivara/AnkGuard";
import Sandhold from "../prefabs/buildings/tivara/Sandhold";
import Temple from "../prefabs/buildings/tivara/Temple";
import TivaraSlingshotFemale from "../prefabs/characters/tivara/TivaraSlingshotFemale";
import TivaraWorkerFemale from "../prefabs/characters/tivara/TivaraWorkerFemale";
import TivaraWorkerMale from "../prefabs/characters/tivara/TivaraWorkerMale";
import WorkMill from "../prefabs/buildings/tivara/WorkMill";
/* START-USER-IMPORTS */
import { ScaleHandler } from "../world/map/scale.handler";
import { InputHandler } from "../world/managers/controllers/input/input.handler";
import { LightsHandler } from "../world/map/vision/lights.handler";
import { DepthHelper } from "../world/map/depth.helper";
import { BaseScene } from "../../../shared/game/phaser/scene/base.scene";
import { ProbableWaffleGameData } from "./probable-waffle-game-data";
import {
  ProbableWaffleGameMode,
  ProbableWaffleGameModeData,
  ProbableWaffleGameState,
  ProbableWaffleGameStateData,
  ProbableWaffleLevels,
  ProbableWafflePlayer,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayerStateData,
  ProbableWaffleSpectator,
  ProbableWaffleSpectatorData
} from "@fuzzy-waddle/api-interfaces";
import { CursorHandler } from "../world/managers/controllers/input/cursor.handler";
import { MapSizeInfo } from "../world/const/map-size.info";
import { GameObjects, Input } from "phaser";
import { AnimatedTilemap } from "../world/map/animated-tile.helper";
/* END-USER-IMPORTS */

export default class MapEmberEnclave extends BaseScene<
  ProbableWaffleGameData,
  ProbableWaffleGameStateData,
  ProbableWaffleGameState,
  ProbableWaffleGameModeData,
  ProbableWaffleGameMode,
  ProbableWafflePlayerStateData,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayer,
  ProbableWaffleSpectatorData,
  ProbableWaffleSpectator
> {
  constructor() {
    super("MapEmberEnclave");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {
    // tilemap
    const tilemap = this.add.tilemap("tiles_ember_enclave");
    tilemap.addTilesetImage("tiles", "tiles_1");
    tilemap.addTilesetImage("tiles_2", "tiles_2");

    // tilemap_level_1
    tilemap.createLayer("TileMap_level_1", ["tiles_2", "tiles"], -32, 0);

    // blockObsidianLava5
    const blockObsidianLava5 = new BlockObsidianLava5(this, -992, 800);
    this.add.existing(blockObsidianLava5);

    // bushDownwardsLarge
    const bushDownwardsLarge = new BushDownwardsLarge(this, 32, 688);
    this.add.existing(bushDownwardsLarge);

    // blockObsidianLava4
    const blockObsidianLava4 = new BlockObsidianLava4(this, 208, 544);
    this.add.existing(blockObsidianLava4);

    // tree6
    const tree6 = new Tree6(this, 0, 736);
    this.add.existing(tree6);

    // bushUpwardsLarge
    const bushUpwardsLarge = new BushUpwardsLarge(this, -48, 768);
    this.add.existing(bushUpwardsLarge);

    // bushDownwardsSmall
    const bushDownwardsSmall = new BushDownwardsSmall(this, 48, 768);
    this.add.existing(bushDownwardsSmall);

    // blockStoneWater4
    const blockStoneWater4 = new BlockStoneWater4(this, 0, 816);
    this.add.existing(blockStoneWater4);

    // ankGuard
    const ankGuard = new AnkGuard(this, 688, 752);
    this.add.existing(ankGuard);

    // sandhold
    const sandhold = new Sandhold(this, 496, 880);
    this.add.existing(sandhold);

    // sandhold_1
    const sandhold_1 = new Sandhold(this, -880, 592);
    this.add.existing(sandhold_1);

    // temple
    const temple = new Temple(this, -607, 882);
    this.add.existing(temple);

    // tivaraSlingshotFemale
    const tivaraSlingshotFemale = new TivaraSlingshotFemale(this, 457, 1095);
    this.add.existing(tivaraSlingshotFemale);

    // tivaraWorkerFemale
    const tivaraWorkerFemale = new TivaraWorkerFemale(this, -992, 736);
    this.add.existing(tivaraWorkerFemale);

    // tivaraWorkerMale
    const tivaraWorkerMale = new TivaraWorkerMale(this, -592, 688);
    this.add.existing(tivaraWorkerMale);

    // workMill
    const workMill = new WorkMill(this, -160, 736);
    this.add.existing(workMill);

    // workMill_1
    const workMill_1 = new WorkMill(this, 192, 704);
    this.add.existing(workMill_1);

    this.tilemap = tilemap;

    this.events.emit("scene-awake");
  }

  private tilemap!: Phaser.Tilemaps.Tilemap;

  /* START-USER-CODE */

  // Write your code here

  create() {
    this.editorCreate();

    new ScaleHandler(this, this.tilemap, { margins: { left: 150, bottom: 100 }, maxLayers: 8 });
    new InputHandler(this);
    new CursorHandler(this);
    new LightsHandler(this, { enableLights: false });
    new DepthHelper(this);
    new AnimatedTilemap(this, this.tilemap, this.tilemap.tilesets);

    console.log("playing level", ProbableWaffleLevels[this.baseGameData.gameInstance.data.gameModeData!.map!].name);

    this.input.on(
      Phaser.Input.Events.POINTER_DOWN,
      (pointer: Input.Pointer, gameObjectsUnderCursor: GameObjects.GameObject[], event: TouchEvent | MouseEvent) => {
        // Check if an interactive object was clicked
        if (gameObjectsUnderCursor.length > 0) {
          // An interactive object was clicked
          console.log("clicked on interactive objects", gameObjectsUnderCursor.length);
          // Handle the click on the interactive object
          // ...
        } else {
          // No interactive object was clicked, handle tilemap click

          const tilemap = this.tilemap;
          // offset pointer by camera position
          const pointerX = pointer.x + this.cameras.main.scrollX;
          const pointerY = pointer.y + this.cameras.main.scrollY + MapSizeInfo.info.tileHeight;

          const clickedTileXY = new Phaser.Math.Vector2();
          Phaser.Tilemaps.Components.IsometricWorldToTileXY(
            pointerX,
            pointerY,
            true,
            clickedTileXY,
            this.cameras.main,
            tilemap.layer
          );

          const maxTileX = tilemap.width;
          const maxTileY = tilemap.height;
          const minTileX = 0;
          const minTileY = 0;
          if (
            clickedTileXY.x < minTileX ||
            clickedTileXY.x > maxTileX ||
            clickedTileXY.y < minTileY ||
            clickedTileXY.y > maxTileY
          ) {
            return;
          }
          console.log("clicked on tile", clickedTileXY.x, clickedTileXY.y);

          // ...
        }
      },
      this
    );
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
