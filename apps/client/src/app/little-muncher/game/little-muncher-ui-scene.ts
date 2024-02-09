import { Scene } from "phaser";
import { CreateSceneFromObjectConfig } from "../../shared/game/phaser/scene/scene-config.interface";
import { Scenes } from "./const/scenes";
import { UiCommunicatorData } from "./ui-communicator";
import { Subscription } from "rxjs";

export class LittleMuncherUiScene extends Scene implements CreateSceneFromObjectConfig {
  private healthSubscription!: Subscription;
  private maxCharacterHealth!: number;
  private healthDisplays: Phaser.GameObjects.Image[] = [];

  constructor() {
    super({ key: Scenes.UiScene });
  }

  init(data: unknown) {
    const uiData = data as UiCommunicatorData;
    this.maxCharacterHealth = uiData.maxCharacterHealth;
    this.healthSubscription = uiData.communicator.setHealth.subscribe((health) => this.updateHealthDisplay(health));
  }

  preload() {
    // pass
  }

  create() {
    this.drawCharacterHealth();
    this.updateHealthDisplay(this.maxCharacterHealth);
  }

  private drawCharacterHealth() {
    for (let i = 0; i < this.maxCharacterHealth; i++) {
      const healthDisplay = this.add.image(40 + i * 30, 100, "lm-atlas", "health");
      this.healthDisplays.push(healthDisplay);
    }
  }

  private updateHealthDisplay = (health: number) => {
    for (let i = 0; i < this.maxCharacterHealth; i++) {
      if (i >= health) {
        this.healthDisplays[i].setVisible(false);
        continue;
      }
      this.healthDisplays[i].setVisible(true);
    }
  };

  destroy() {
    this.healthSubscription.unsubscribe();
    this.healthDisplays.forEach((healthDisplay) => healthDisplay.destroy());
  }
}
