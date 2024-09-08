import { MapSizeInfo } from "../const/map-size.info";
import { Cameras, Scale, Structs } from "phaser";

export class ScaleHandler {
  private readonly mainCamera: Cameras.Scene2D.Camera;
  private scaleManager: Scale.ScaleManager;
  private cameras: Cameras.Scene2D.CameraManager;

  constructor(
    scene: Phaser.Scene,
    private readonly tilemap: Phaser.Tilemaps.Tilemap,
    private readonly config: {
      margins: {
        bottom: number;
        left: number;
      };
      maxLayers: number;
    }
  ) {
    this.cameras = scene.cameras;
    this.mainCamera = this.cameras.main;
    this.scaleManager = scene.scale;
    // center by default
    this.setupBounds(true);
    this.setupResizeListener();
  }

  setupResizeListener() {
    this.scaleManager.on(Scale.Events.RESIZE, this.resize, this);
  }

  setupBounds(centerOn: boolean = false) {
    const maxMapLayers = this.config.maxLayers;
    // noinspection UnnecessaryLocalVariableJS
    const topMarginDueToMapLayers = maxMapLayers * MapSizeInfo.info.tileHeight;
    const topMargin = topMarginDueToMapLayers;
    const leftMargin = this.config.margins.left;
    const bottomMargin = this.config.margins.bottom;
    const mapLeft = -this.tilemap.widthInPixels / 2 - leftMargin;
    const mapRight = +this.tilemap.widthInPixels / 2;
    const mapTop = -topMargin;
    const mapBottom = this.tilemap.heightInPixels + bottomMargin;

    this.mainCamera.setBounds(mapLeft, mapTop, mapRight - mapLeft, mapBottom - mapTop, centerOn);
  }

  destroy() {
    this.scaleManager.off(Scale.Events.RESIZE);
  }

  /**
   * * When the screen is resized
   */
  private resize(gameSize: Structs.Size): void {
    this.cameras.resize(gameSize.width, gameSize.height);
    this.setupBounds(false);
  }
}
