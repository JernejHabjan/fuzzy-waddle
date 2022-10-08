import * as Phaser from 'phaser';
import { MapSizeInfo } from '../const/map-size.info';

export class ScaleHandler {
  private readonly mainCamera: Phaser.Cameras.Scene2D.Camera;
  private scaleManager: Phaser.Scale.ScaleManager;
  private cameras: Phaser.Cameras.Scene2D.CameraManager;

  constructor(cameras: Phaser.Cameras.Scene2D.CameraManager, scaleManager: Phaser.Scale.ScaleManager) {
    this.cameras = cameras;
    this.mainCamera = cameras.main;
    this.scaleManager = scaleManager;
    this.setupBounds(true); // todo now center for dev
    this.setupResizeListener();
  }

  setupResizeListener() {
    this.scaleManager.on(Phaser.Scale.Events.RESIZE, this.resize, this);
  }

  setupBounds(centerOn: boolean = false) {
    const xOffset = MapSizeInfo.info.tileWidthHalf;
    const yOffset = MapSizeInfo.info.tileHeight;

    this.mainCamera.setBounds(
      -MapSizeInfo.info.widthInPixels / 2 + xOffset,
      yOffset,
      MapSizeInfo.info.widthInPixels,
      MapSizeInfo.info.heightInPixels,
      centerOn
    );
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
