export class IconHelper {
  static setIcon(
    image: Phaser.GameObjects.Image,
    key: string,
    frame: string,
    origin: { x: number; y: number },
    size: { maxWidth: number; maxHeight: number }
  ) {
    image.setTexture(key, frame);
    image.setOrigin(origin.x, origin.y);

    const { maxWidth, maxHeight } = size;
    const aspectRatio = image.width / image.height;

    let newWidth = maxWidth;
    let newHeight = maxHeight;

    if (aspectRatio > 1) {
      // Image is wider than tall
      newHeight = maxWidth / aspectRatio;
    } else {
      // Image is taller than wide
      newWidth = maxHeight * aspectRatio;
    }

    image.setDisplaySize(newWidth, newHeight);
  }
}
