import { MapSizeInfo } from '../const/map-size.info';

export class MinimapTextureHelper {
  private scene: Phaser.Scene;
  private readonly mapSizePercentageToWholeWindow = 0.02;
  private minimap!: Phaser.Cameras.Scene2D.Camera;
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  createRenderTexture() {
    const width = this.scene.game.canvas.width * this.mapSizePercentageToWholeWindow;
    const height = this.scene.game.canvas.height * this.mapSizePercentageToWholeWindow;
    const mapSizeInPx = Math.round(Math.min(width, height));

    const mapWidth = MapSizeInfo.info.width;
    const mapHeight = MapSizeInfo.info.height;

    const rectangleWidth = Math.round(mapSizeInPx / mapWidth);
    const rectangleHeight = Math.round(mapSizeInPx / mapHeight);

    const renderTexture = this.scene.add.renderTexture(0, 0, rectangleWidth * mapWidth, rectangleHeight * mapHeight);

    // set render texture background
    renderTexture.fill(0x000000, 0.5);

    for (let x = 0; x < mapWidth; x++) {
      for (let y = 0; y < mapHeight; y++) {
        const tile = Math.random() > 0.5 ? 1 : 0;
        const color = tile ? 0x1d7196 : 0x0ff000;
        renderTexture.fill(color, 1, x * rectangleWidth, y * rectangleHeight, rectangleWidth, rectangleHeight);
      }
    }
  }

  createMinimapCamera(cameras: Phaser.Cameras.Scene2D.CameraManager) {
    //  The miniCam is 400px wide, so can display the whole world at a zoom of 0.2
    this.minimap = cameras.add(200, 10, 400, 100).setZoom(0.2).setName('mini');

    // this.minimap.scrollX = cameras.main.scrollX;
    // this.minimap.scrollY = cameras.main.scrollY;

    this.minimap.setBackgroundColor(0x002244);
  }
}
