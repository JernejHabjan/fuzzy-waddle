import Phaser from "phaser";

/** CameraManager calls willRender after preRender resolves following, bounds, zoom and camera effects. */
export class FogOfWarGraphics extends Phaser.GameObjects.Graphics {
  constructor(
    scene: Phaser.Scene,
    private readonly refresh: (camera: Phaser.Cameras.Scene2D.Camera) => void
  ) {
    super(scene);
  }

  override willRender(camera: Phaser.Cameras.Scene2D.Camera): boolean {
    if (!this.scene || !super.willRender(camera)) return false;
    this.refresh(camera);
    return true;
  }
}
