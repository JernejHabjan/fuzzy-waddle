import type Phaser from "phaser";

export class BannerShowcaseLayout {
  static readonly CHARACTER_COUNT = 2;
  static readonly MAX_SCALE = 3.2;
  static readonly MIN_SCALE = 1.25;

  static layoutCharacters(
    camera: Phaser.Cameras.Scene2D.Camera,
    characters: Phaser.GameObjects.Sprite[],
    scaleMultipliers: number[]
  ): void {
    if (!characters.length) {
      return;
    }

    const slotHeight = camera.height / characters.length;
    const centerX = camera.width / 2;

    characters.forEach((character, index) => {
      const bounds = character.getBounds();
      const availableHeight = Math.max(slotHeight * 0.72, 1);
      const availableWidth = Math.max(camera.width * 0.8, 1);
      const baseScale = Math.min(availableWidth / bounds.width, availableHeight / bounds.height);
      const targetScale = Phaser.Math.Clamp(
        baseScale * (scaleMultipliers[index] ?? 1),
        BannerShowcaseLayout.MIN_SCALE,
        BannerShowcaseLayout.MAX_SCALE
      );

      character.setScale(targetScale);

      const scaledBounds = character.getBounds();
      const slotCenterY = slotHeight * index + slotHeight / 2;
      const targetY = slotCenterY + (scaledBounds.height * 0.5 - scaledBounds.bottom);

      character.setPosition(centerX, targetY);
    });
  }
}
