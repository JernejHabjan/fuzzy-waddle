export class MapSizeInfo {
  public widthInPixels: number;
  public heightInPixels: number;

  constructor(public width: number, public height: number, public tileWidth: number, public tileHeight: number) {
    this.widthInPixels = width * tileWidth;
    this.heightInPixels = height * tileHeight;
  }
}
