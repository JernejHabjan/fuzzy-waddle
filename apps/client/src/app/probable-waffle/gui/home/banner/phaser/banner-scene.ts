import Phaser from "phaser";
import { bannerShowcaseCatalog } from "./banner-showcase.catalog";
import { BannerShowcaseLayout } from "./banner-showcase-layout";
import type { BannerAssetFile, BannerCharacterConfig } from "./banner-showcase.models";

export class BannerScene extends Phaser.Scene {
  private readonly selectedCharacters = Phaser.Utils.Array.Shuffle([...bannerShowcaseCatalog]).slice(
    0,
    BannerShowcaseLayout.CHARACTER_COUNT
  );

  private readonly characterSprites: Phaser.GameObjects.Sprite[] = [];

  constructor() {
    super({ key: "BannerScene" });
  }

  preload(): void {
    for (const character of this.selectedCharacters) {
      this.preloadCharacter(character);
    }
  }

  create(): void {
    for (const character of this.selectedCharacters) {
      const sprite = this.add.sprite(0, 0, character.textureKey, character.frame);
      sprite.setAlpha(0);
      sprite.setOrigin(0.5, character.originY ?? 0.9);

      if (character.idleAnimationKey && this.anims.exists(character.idleAnimationKey)) {
        sprite.play(character.idleAnimationKey);
      }

      this.characterSprites.push(sprite);
    }

    this.layoutCharacters();
    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);

    this.tweens.add({
      targets: this.characterSprites,
      alpha: 1,
      duration: 700,
      ease: "Power2",
      stagger: 120
    });
  }

  private preloadCharacter(character: BannerCharacterConfig): void {
    for (const file of character.files) {
      this.preloadFile(file);
    }
  }

  private preloadFile(file: BannerAssetFile): void {
    switch (file.type) {
      case "animation":
        this.load.animation(file.key, file.url);
        return;
      case "image":
        this.load.image(file.key, file.url);
        return;
      case "multiatlas":
        this.load.multiatlas(file.key, file.url, file.path);
        return;
      case "spritesheet":
        this.load.spritesheet(file.key, file.url, file.frameConfig);
        return;
    }
  }

  private handleResize(): void {
    this.layoutCharacters();
  }

  private layoutCharacters(): void {
    BannerShowcaseLayout.layoutCharacters(
      this.cameras.main,
      this.characterSprites,
      this.selectedCharacters.map((character) => character.scaleMultiplier ?? 1)
    );
  }

  private handleShutdown(): void {
    this.scale.off("resize", this.handleResize, this);
  }
}
