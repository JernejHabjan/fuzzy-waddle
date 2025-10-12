import { Scene } from "phaser";
import { type CreateSceneFromObjectConfig } from "../../../shared/game/phaser/scene/scene-config.interface";
import { AssetsDungeon } from "../assets";
import { DungeonCrawlerScenes } from "../dungeonCrawlerScenes";

export default class DungeonPreloader extends Scene implements CreateSceneFromObjectConfig {
  constructor() {
    super({ key: DungeonCrawlerScenes.PreloadSceneDungeon });
  }

  preload() {
    this.load.image(AssetsDungeon.tiles, "assets/dungeon-crawler/tiles/dungeon_tiles.png");
    this.load.tilemapTiledJSON(AssetsDungeon.dungeon, "assets/dungeon-crawler/tiles/dungeon-01.json");

    this.load.atlas(
      AssetsDungeon.faune,
      "assets/dungeon-crawler/character/fauna.png",
      "assets/dungeon-crawler/character/fauna.json"
    );
    this.load.atlas(
      AssetsDungeon.lizard,
      "assets/dungeon-crawler/enemies/lizard.png",
      "assets/dungeon-crawler/enemies/lizard.json"
    );
    this.load.atlas(
      AssetsDungeon.treasure,
      "assets/dungeon-crawler/items/treasure.png",
      "assets/dungeon-crawler/items/treasure.json"
    );

    this.load.image(AssetsDungeon.heartEmpty, "assets/dungeon-crawler/ui/ui_heart_empty.png");
    this.load.image(AssetsDungeon.heartFull, "assets/dungeon-crawler/ui/ui_heart_full.png");

    this.load.image(AssetsDungeon.knife, "assets/dungeon-crawler/weapons/weapon_knife.png");
  }

  create() {
    this.scene.start(DungeonCrawlerScenes.MainSceneDungeon);
  }
}
