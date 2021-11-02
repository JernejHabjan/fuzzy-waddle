import { CreateSceneFromObjectConfig } from "../../../phaser/phaser";
import { Scenes } from "../../scenes";
import { AssetsDungeon, SceneEventTypes } from "../assets";
import { sceneEvents } from "../events/EventCenter";

export default class DungeonUi extends Phaser.Scene implements CreateSceneFromObjectConfig {
  private hearts: Phaser.GameObjects.Group;

  constructor() {
    super({ key: Scenes.DungeonUi });
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

    sceneEvents.on(SceneEventTypes.playerHealthChanged, this.handlePlayerHealthChanged, this);

    // cleanup
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      sceneEvents.off(SceneEventTypes.playerHealthChanged, this.handlePlayerHealthChanged, this);
    });
  }

  private handlePlayerHealthChanged(health: number) {
    this.hearts.children.each((go, idx) => {
      const heart = go as Phaser.GameObjects.Image;
      if (idx <= health - 1) {
        heart.setTexture(AssetsDungeon.heartFull);
      } else {
        heart.setTexture(AssetsDungeon.heartEmpty);
      }
    });
  }
}
