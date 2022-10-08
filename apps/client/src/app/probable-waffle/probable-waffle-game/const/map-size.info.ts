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
}
