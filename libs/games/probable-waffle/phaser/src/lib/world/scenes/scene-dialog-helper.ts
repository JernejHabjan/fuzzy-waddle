import { LockedCursorHandler } from "../../player/human-controller/locked-cursor.handler";

export class SceneDialogHelper {
  static showDialog<T extends Phaser.Scene>(scene: Phaser.Scene, dialogKey: string, dialogData?: any): T {
    const layer = scene.scene.get<T>(dialogKey) as T;
    layer.scene.start();
    LockedCursorHandler.releasePointerLock(scene.input);
    return layer;
  }
}
