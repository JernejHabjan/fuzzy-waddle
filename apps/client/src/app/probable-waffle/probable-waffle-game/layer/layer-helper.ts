export class LayerHelper {
  // todo use this
  static getTileAt(tileX: number, tileY: number, data: Phaser.Tilemaps.Tile[][]) {
    if (tileX < 0 || tileY < 0 || tileX >= data.length || tileY >= data[0].length) {
      return null;
    }
    return data[tileX][tileY];
  }
}
