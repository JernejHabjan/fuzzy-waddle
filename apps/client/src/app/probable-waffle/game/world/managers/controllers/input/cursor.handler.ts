export class CursorHandler {
  public static readonly penCursor = "url(assets/probable-waffle/input/cursors/pen.cur), pointer";

  constructor(private readonly scene: Phaser.Scene) {
    this.setupCursor();
    scene.events.once("destroy", this.destroy, this);
  }

  destroy() {
    this.scene.input.setDefaultCursor("default");
  }

  private setupCursor() {
    this.scene.input.setDefaultCursor("url(assets/probable-waffle/input/cursors/sc2/SC2-cursor.cur), pointer");
  }
}
