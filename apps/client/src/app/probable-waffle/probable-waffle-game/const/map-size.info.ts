export class MapSizeInfo {
  static info: MapSizeInfo;

  public widthInPixels: number;
  public heightInPixels: number;
  public tileWidthHalf: number;
  public tileHeightHalf: number;
  constructor(public width: number, public height: number, public tileWidth: number, public tileHeight: number) {
    this.widthInPixels = width * tileWidth;
    this.heightInPixels = height * tileHeight;
    this.tileWidthHalf = tileWidth / 2;
    this.tileHeightHalf = tileHeight / 2;
  }
}

export class MapDefinitions {
  static nrLayers = 3;

  static mapJson = 'assets/probable-waffle/tilemaps/start-small.json';
  // big map
  // static mapJson = "https://labs.phaser.io/assets/tilemaps/iso/isorpg.json";

  static atlasSuffix = '-atlas';
  static atlasOutside = 'iso-64x64-outside';
  static atlasBuilding = 'iso-64x64-building';
  static mapAtlases = [MapDefinitions.atlasOutside, MapDefinitions.atlasBuilding];
}
