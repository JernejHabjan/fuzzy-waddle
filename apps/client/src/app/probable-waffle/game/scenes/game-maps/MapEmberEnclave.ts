// You can write more code here

/* START OF COMPILED CODE */

import GameProbableWaffleScene from "../GameProbableWaffleScene";
import Spawn from "../../prefabs/buildings/misc/Spawn";
import EditorOwner from "../../editor-components/EditorOwner";
import BlockObsidianLava5 from "../../prefabs/outside/nature/block_obsidian_lava/BlockObsidianLava5";
import BushDownwardsLarge from "../../prefabs/outside/foliage/bushes/BushDownwardsLarge";
import BlockObsidianLava4 from "../../prefabs/outside/nature/block_obsidian_lava/BlockObsidianLava4";
import Tree6 from "../../prefabs/outside/foliage/trees/resources/Tree6";
import BushUpwardsLarge from "../../prefabs/outside/foliage/bushes/BushUpwardsLarge";
import BushDownwardsSmall from "../../prefabs/outside/foliage/bushes/BushDownwardsSmall";
import BlockStoneWater4 from "../../prefabs/outside/nature/block_stone_water/BlockStoneWater4";
import AnkGuard from "../../prefabs/buildings/tivara/AnkGuard";
import Sandhold from "../../prefabs/buildings/tivara/Sandhold";
import Temple from "../../prefabs/buildings/tivara/Temple";
import TivaraSlingshotFemale from "../../prefabs/characters/tivara/tivara-slingshot-female/TivaraSlingshotFemale";
import TivaraWorkerFemale from "../../prefabs/characters/tivara/tivara-worker/tivara-worker-female/TivaraWorkerFemale";
import TivaraWorkerMale from "../../prefabs/characters/tivara/tivara-worker/tivara-worker-male/TivaraWorkerMale";
import WorkMill from "../../prefabs/buildings/tivara/WorkMill";
import SkaduweeMagicianFemale from "../../prefabs/characters/skaduwee/skaduwee-magician-female/SkaduweeMagicianFemale";
import SkaduweeWorkerMale from "../../prefabs/characters/skaduwee/skaduwee-worker/skaduwee-worker-male/SkaduweeWorkerMale";
import SoundEffectMarker from "../../prefabs/buildings/misc/SoundEffectMarker";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class MapEmberEnclave extends GameProbableWaffleScene {
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
    tilemap.createLayer("TileMap_level_1", ["tiles_2", "tiles"], 0, 0);

    // spawn_2
    const spawn_2 = new Spawn(this, -176, 1264);
    this.add.existing(spawn_2);

    // spawn_1
    const spawn_1 = new Spawn(this, 464, 848);
    this.add.existing(spawn_1);

    // spawn
    const spawn = new Spawn(this, -848, 576);
    this.add.existing(spawn);

    // blockObsidianLava5
    const blockObsidianLava5 = new BlockObsidianLava5(this, -960, 800);
    this.add.existing(blockObsidianLava5);

    // bushDownwardsLarge
    const bushDownwardsLarge = new BushDownwardsLarge(this, 32, 704);
    this.add.existing(bushDownwardsLarge);

    // blockObsidianLava4
    const blockObsidianLava4 = new BlockObsidianLava4(this, 224, 544);
    this.add.existing(blockObsidianLava4);

    // tree6
    const tree6 = new Tree6(this, 0, 736);
    this.add.existing(tree6);

    // bushUpwardsLarge
    const bushUpwardsLarge = new BushUpwardsLarge(this, -64, 768);
    this.add.existing(bushUpwardsLarge);

    // bushDownwardsSmall
    const bushDownwardsSmall = new BushDownwardsSmall(this, 64, 752);
    this.add.existing(bushDownwardsSmall);

    // blockStoneWater4
    const blockStoneWater4 = new BlockStoneWater4(this, 0, 816);
    this.add.existing(blockStoneWater4);

    // ankGuard
    const ankGuard = new AnkGuard(this, 704, 752);
    this.add.existing(ankGuard);

    // sandhold
    const sandhold = new Sandhold(this, 480, 656);
    this.add.existing(sandhold);

    // sandhold_1
    const sandhold_1 = new Sandhold(this, -576, 448);
    this.add.existing(sandhold_1);

    // temple
    const temple = new Temple(this, -1168, 688);
    this.add.existing(temple);

    // tivaraSlingshotFemale
    const tivaraSlingshotFemale = new TivaraSlingshotFemale(this, 672, 880);
    this.add.existing(tivaraSlingshotFemale);

    // tivaraWorkerFemale
    const tivaraWorkerFemale = new TivaraWorkerFemale(this, -992, 720);
    this.add.existing(tivaraWorkerFemale);

    // tivaraWorkerMale
    const tivaraWorkerMale = new TivaraWorkerMale(this, -576, 688);
    this.add.existing(tivaraWorkerMale);

    // workMill
    const workMill = new WorkMill(this, -128, 736);
    this.add.existing(workMill);

    // workMill_1
    const workMill_1 = new WorkMill(this, 192, 704);
    this.add.existing(workMill_1);

    // skaduweeMagicianFemale
    const skaduweeMagicianFemale = new SkaduweeMagicianFemale(this, 48, 1328);
    this.add.existing(skaduweeMagicianFemale);

    // skaduweeWorkerMale
    const skaduweeWorkerMale = new SkaduweeWorkerMale(this, -368, 1328);
    this.add.existing(skaduweeWorkerMale);

    // workMill_2
    const workMill_2 = new WorkMill(this, -80, 864);
    this.add.existing(workMill_2);

    // lavaSfx
    const lavaSfx = new SoundEffectMarker(this, -640, 656);
    this.add.existing(lavaSfx);

    // lavaSfx_1
    const lavaSfx_1 = new SoundEffectMarker(this, -608, 912);
    this.add.existing(lavaSfx_1);

    // lavaSfx_2
    const lavaSfx_2 = new SoundEffectMarker(this, -1056, 816);
    this.add.existing(lavaSfx_2);

    // spawn_2 (components)
    const spawn_2EditorOwner = new EditorOwner(spawn_2);
    spawn_2EditorOwner.owner_id = "3";

    // spawn_1 (components)
    const spawn_1EditorOwner = new EditorOwner(spawn_1);
    spawn_1EditorOwner.owner_id = "2";

    // spawn (components)
    const spawnEditorOwner = new EditorOwner(spawn);
    spawnEditorOwner.owner_id = "1";

    // ankGuard (components)
    const ankGuardEditorOwner = new EditorOwner(ankGuard);
    ankGuardEditorOwner.owner_id = "2";

    // sandhold (components)
    const sandholdEditorOwner = new EditorOwner(sandhold);
    sandholdEditorOwner.owner_id = "2";

    // sandhold_1 (components)
    const sandhold_1EditorOwner = new EditorOwner(sandhold_1);
    sandhold_1EditorOwner.owner_id = "1";

    // temple (components)
    const templeEditorOwner = new EditorOwner(temple);
    templeEditorOwner.owner_id = "1";

    // tivaraSlingshotFemale (components)
    const tivaraSlingshotFemaleEditorOwner = new EditorOwner(tivaraSlingshotFemale);
    tivaraSlingshotFemaleEditorOwner.owner_id = "2";

    // tivaraWorkerFemale (components)
    const tivaraWorkerFemaleEditorOwner = new EditorOwner(tivaraWorkerFemale);
    tivaraWorkerFemaleEditorOwner.owner_id = "1";

    // tivaraWorkerMale (components)
    const tivaraWorkerMaleEditorOwner = new EditorOwner(tivaraWorkerMale);
    tivaraWorkerMaleEditorOwner.owner_id = "1";

    // workMill (components)
    const workMillEditorOwner = new EditorOwner(workMill);
    workMillEditorOwner.owner_id = "1";

    // workMill_1 (components)
    const workMill_1EditorOwner = new EditorOwner(workMill_1);
    workMill_1EditorOwner.owner_id = "2";

    // skaduweeMagicianFemale (components)
    const skaduweeMagicianFemaleEditorOwner = new EditorOwner(skaduweeMagicianFemale);
    skaduweeMagicianFemaleEditorOwner.owner_id = "3";

    // skaduweeWorkerMale (components)
    const skaduweeWorkerMaleEditorOwner = new EditorOwner(skaduweeWorkerMale);
    skaduweeWorkerMaleEditorOwner.owner_id = "3";

    // workMill_2 (components)
    const workMill_2EditorOwner = new EditorOwner(workMill_2);
    workMill_2EditorOwner.owner_id = "3";

    // lavaSfx (prefab fields)
    lavaSfx.sfxType = "lava";

    // lavaSfx_1 (prefab fields)
    lavaSfx_1.sfxType = "lava";

    // lavaSfx_2 (prefab fields)
    lavaSfx_2.sfxType = "lava";

    this.tilemap = tilemap;

    this.events.emit("scene-awake");
  }

  public override tilemap!: Phaser.Tilemaps.Tilemap;

  /* START-USER-CODE */

  override create() {
    this.editorCreate();

    super.create();

    this.applySmokeTint();
    this.spawnClouds();
  }

  private applySmokeTint() {
    const tint = 0xcccccc;
    this.children.each(function (child: any) {
      // if tilemap, then skip
      if (child instanceof Phaser.Tilemaps.TilemapLayer) {
        return;
      }

      if (child.setTint) {
        child.setTint(tint); // Apply a dark tint
      }
      if (child instanceof Phaser.GameObjects.Container) {
        child.list.forEach((child: any) => {
          if (child.setTint) {
            child.setTint(tint); // Apply a dark tint
          }
        });
      }
    });
    console.log("tinted for effect");
  }

  private spawnClouds() {
    // Get tilemap dimensions
    const tilemapWidth = this.tilemap.widthInPixels;
    const tilemapHeight = this.tilemap.heightInPixels;

    // Function to spawn a single cloud
    const spawnSingleCloud = (startOffScreen: boolean = true) => {
      const cloud = this.add.image(0, 0, "factions", "buildings/skaduwee/infantry_inn/cloud-vertical.png");

      // Rotate cloud to be horizontal
      cloud.setAngle(90);
      cloud.setAlpha(0.05 + Math.random() * 0.05);
      cloud.setOrigin(0, 0);
      cloud.setDepth(1000000);

      // Randomize cloud position within the tilemap area
      const randomY = Phaser.Math.Between(-tilemapHeight / 4, tilemapHeight);

      // If starting off-screen, position clouds left of the map
      let randomX;
      if (startOffScreen) {
        randomX = -Phaser.Math.Between(0, tilemapWidth); // Starts off-screen
      } else {
        randomX = Phaser.Math.Between(0, tilemapWidth); // Starts somewhere on-screen
      }

      cloud.setPosition(randomX, randomY);
      const scale = Phaser.Math.Between(4, 20);
      cloud.setScale(scale);

      // Tween cloud to move across the map
      this.tweens.add({
        targets: cloud,
        x: tilemapWidth + 200, // Moves beyond the right edge of the map
        duration: 20000 + scale * 3000, // Larger clouds move slower
        repeat: -1,

        onComplete: () => {
          // Reset cloud position after completing the tween
          cloud.setPosition(randomX, randomY);
        }
      });
    };

    // Spawn multiple clouds
    const numClouds = 100; // Adjust the number of clouds as needed
    for (let i = 0; i < numClouds; i++) {
      const startOffScreen = i < numClouds / 2; // Half of the clouds start on-screen
      spawnSingleCloud(startOffScreen); // Randomize spawn time
    }
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
