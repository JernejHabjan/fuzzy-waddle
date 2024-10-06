import { LockedCursorHandler } from "./locked-cursor.handler";

export class CursorHandler {
  public static readonly penCursor = "url(assets/probable-waffle/input/cursors/pen.cur), pointer";

  constructor(private readonly scene: Phaser.Scene) {
    new LockedCursorHandler(scene);
    this.setupCursor();
  }

  private setupCursor() {
    this.scene.input.setDefaultCursor("url(assets/probable-waffle/input/cursors/sc2/SC2-cursor.cur), pointer");
  }
}
