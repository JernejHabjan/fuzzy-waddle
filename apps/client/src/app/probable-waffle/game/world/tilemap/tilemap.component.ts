export class TilemapComponent {
  static tileWidth = 64;
  constructor(public readonly tilemap: Phaser.Tilemaps.Tilemap) {}

  get data(): Phaser.Tilemaps.Tile[][] {
    const firstLayer = this.tilemap.layers[0];
    if (!firstLayer) {
      throw new Error("Tilemap has no layers");
    }
    return firstLayer.data;
  }
}
