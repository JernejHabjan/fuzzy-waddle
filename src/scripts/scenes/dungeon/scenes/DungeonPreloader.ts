import { Scenes } from "../../scenes";
import { CreateSceneFromObjectConfig } from "../../../phaser/phaser";
import { AssetsDungeon } from "../assets";

export default class DungeonPreloader extends Phaser.Scene implements CreateSceneFromObjectConfig {
  constructor() {
    super({ key: Scenes.PreloadSceneDungeon });
  }

  preload() {
    this.load.image(AssetsDungeon.tiles, "assets/dungeon/tiles/dungeon_tiles.png");
    this.load.tilemapTiledJSON(AssetsDungeon.dungeon, "assets/dungeon/tiles/dungeon-01.json");

    this.load.atlas(AssetsDungeon.faune, "assets/dungeon/character/fauna.png", "assets/dungeon/character/fauna.json");
    this.load.atlas(AssetsDungeon.lizard, "assets/dungeon/enemies/lizard.png", "assets/dungeon/enemies/lizard.json");
    this.load.atlas(AssetsDungeon.treasure, "assets/dungeon/items/treasure.png", "assets/dungeon/items/treasure.json");

    this.load.image(AssetsDungeon.heartEmpty, "assets/dungeon/ui/ui_heart_empty.png");
    this.load.image(AssetsDungeon.heartFull, "assets/dungeon/ui/ui_heart_full.png");

    this.load.image(AssetsDungeon.knife, "assets/dungeon/weapons/weapon_knife.png");
  }

  create() {
    this.scene.start(Scenes.MainSceneDungeon);
  }
}
