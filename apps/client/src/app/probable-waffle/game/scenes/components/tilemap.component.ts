export class TilemapComponent {
  static tileWidth = 64;
  constructor(public readonly tilemap: Phaser.Tilemaps.Tilemap) {}

  get data(): Phaser.Tilemaps.Tile[][] {
    return this.tilemap.layers[0].data;
  }
}
