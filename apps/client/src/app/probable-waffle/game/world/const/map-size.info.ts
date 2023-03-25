export class MapSizeInfo {
  static readonly info: MapSizeInfo = new MapSizeInfo();
  public tileWidth = 64;
  public tileHeight = 32;
  public widthInPixels = this.width * this.tileWidth;
  public heightInPixels = this.height * this.tileHeight;
  public tileWidthHalf = 32;
  public tileHeightHalf = 16;

  private _width = 10;

  get width(): number {
    return this._width;
  }

  public set width(value: number) {
    this._width = value;
    this.widthInPixels = this._width * this.tileWidth;
  }

  private _height = 10;

  get height(): number {
    return this._height;
  }

  set height(value: number) {
    this._height = value;
    this.heightInPixels = this._height * this.tileHeight;
  }
}

export class MapDefinitions {
  static nrLayers = 3;

  static tilemapMapName = 'map';
  static tilemapMapJson = 'assets/probable-waffle/tilemaps/start-small.json';
  // static tilemapMapJson = 'assets/probable-waffle/tilemaps/start-large.json'; big map

  static atlasSuffix = '-atlas';
  static atlasMegaset = 'megaset-0';
  static atlasBuildings = 'buildings';
  static atlasCharacters = 'characters';
  static atlasOutside = 'iso-64x64-outside';
  static atlasBuilding = 'iso-64x64-building';
  static mapAtlases = [MapDefinitions.atlasOutside, MapDefinitions.atlasBuilding];
}

export class TileDefinitions {
  static tileRemoveIndex = -1;
  static waterHeight = -8;
}
