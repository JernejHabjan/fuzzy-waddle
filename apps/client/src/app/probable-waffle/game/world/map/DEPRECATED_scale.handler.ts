import { MapDefinitions, MapSizeInfo_old } from "../const/map-size.info_old";
import { Cameras, Scale, Structs } from "phaser";

export class DEPRECATED_scaleHandler {
  private readonly mainCamera: Cameras.Scene2D.Camera;
  private scaleManager: Scale.ScaleManager;
  private cameras: Cameras.Scene2D.CameraManager;

  constructor(cameras: Cameras.Scene2D.CameraManager, scaleManager: Scale.ScaleManager) {
    this.cameras = cameras;
    this.mainCamera = cameras.main;
    this.scaleManager = scaleManager;
    this.setupBounds(true); // todo now center for dev
    this.setupResizeListener();
  }

  setupResizeListener() {
    this.scaleManager.on(Scale.Events.RESIZE, this.resize, this);
  }

  setupBounds(centerOn: boolean = false) {
    const xOffset = MapSizeInfo_old.info.tileWidthHalf;
    const yOffset = MapSizeInfo_old.info.tileHeight;

    const layersOffsetY = MapSizeInfo_old.info.tileHeight * (MapDefinitions.nrLayers + 1);

    this.mainCamera.setBounds(
      -MapSizeInfo_old.info.widthInPixels / 2 + xOffset,
      yOffset - layersOffsetY,
      MapSizeInfo_old.info.widthInPixels,
      MapSizeInfo_old.info.heightInPixels + layersOffsetY,
      centerOn
    );
  }

  destroy() {
    this.scaleManager.off(Scale.Events.RESIZE);
  }

  /**
   * * When the screen is resized
   */
  private resize(gameSize: Structs.Size): void {
    this.cameras.resize(gameSize.width, gameSize.height);
    this.setupBounds(true); // todo now center for dev
  }
}
