import * as Phaser from 'phaser';
import { MapSizeInfo } from '../const/map-size.info';

export class ScaleHandler {
  private readonly mainCamera: Phaser.Cameras.Scene2D.Camera;
  private scaleManager: Phaser.Scale.ScaleManager;
  private cameras: Phaser.Cameras.Scene2D.CameraManager;
  private mapSizeInfo: MapSizeInfo;

  constructor(
    cameras: Phaser.Cameras.Scene2D.CameraManager,
    scaleManager: Phaser.Scale.ScaleManager,
    mapSizeInfo: MapSizeInfo
  ) {
    this.cameras = cameras;
    this.mainCamera = cameras.main;
    this.scaleManager = scaleManager;
    this.mapSizeInfo = mapSizeInfo;
    this.setupBounds(true); // todo now center for dev
    this.setupResizeListener();
  }

  setupResizeListener() {
    this.scaleManager.on(Phaser.Scale.Events.RESIZE, this.resize, this);
  }

  /**
   * todo this needs to be improved
   */
  setupBounds(centerOn: boolean = false) {
    const cameraBoundX = this.mainCamera.width / 2 + this.mapSizeInfo.tileWidth / 2;
    const cameraBoundY = this.mainCamera.height / 2 + this.mapSizeInfo.heightInPixels / 2;
    this.mainCamera.setBounds(-cameraBoundX, -(cameraBoundY * 0.66), cameraBoundX * 2, cameraBoundY * 2, centerOn);
  }

  /**
   * * When the screen is resized
   */
  private resize(gameSize: Phaser.Structs.Size): void {
    this.cameras.resize(gameSize.width, gameSize.height);
    this.setupBounds(true); // todo now center for dev
  }

  destroy() {
    this.scaleManager.off(Phaser.Scale.Events.RESIZE);
  }
}
