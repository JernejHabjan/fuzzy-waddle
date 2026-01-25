import GameActionsLayer from "./hud-scenes/GameActionsLayer";
import { LockedCursorHandler } from "../../player/human-controller/locked-cursor.handler";

export class SceneDialogHelper {
  static showDialog<T>(scene: Phaser.Scene, dialogKey: string, dialogData?: any): T {
    const layer = scene.scene.get<GameActionsLayer>(dialogKey) as GameActionsLayer;
    layer.scene.start();
    LockedCursorHandler.releasePointerLock(scene.input);
    return layer as unknown as T;
  }
}
