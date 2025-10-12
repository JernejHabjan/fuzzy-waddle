import { Scene } from "phaser";
import { type CreateSceneFromObjectConfig } from "../../../shared/game/phaser/scene/scene-config.interface";
import { AssetsDungeon, DungeonCrawlerSceneEventTypes } from "../assets";
import { sceneEvents } from "../events/EventCenter";
import { DungeonCrawlerScenes } from "../dungeonCrawlerScenes";

export default class DungeonUi extends Scene implements CreateSceneFromObjectConfig {
  private hearts!: Phaser.GameObjects.Group;

  constructor() {
    super({ key: DungeonCrawlerScenes.DungeonUi });
  }

  create() {
    this.hearts = this.add.group({
      classType: Phaser.GameObjects.Image
    });

    this.hearts.createMultiple({
      key: AssetsDungeon.heartFull,
      setXY: {
        x: 10,
        y: 10,
        stepX: 16
      },
      quantity: 3
    });

    sceneEvents.on(DungeonCrawlerSceneEventTypes.playerHealthChanged, this.handlePlayerHealthChanged, this);

    // cleanup
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      sceneEvents.off(DungeonCrawlerSceneEventTypes.playerHealthChanged, this.handlePlayerHealthChanged, this);
    });
  }

  private handlePlayerHealthChanged(health: number) {
    this.hearts.children.forEach((go: any, idx: any): boolean => {
      const heart = go as Phaser.GameObjects.Image;
      if (idx <= health - 1) {
        heart.setTexture(AssetsDungeon.heartFull);
      } else {
        heart.setTexture(AssetsDungeon.heartEmpty);
      }
      return true;
    });
  }
}
