import { LittleMuncherScene } from "./little-muncher-scene";

export class Pause {
  constructor(private readonly littleMuncherScene: LittleMuncherScene) {
    this.init();
  }

  private init() {
    this.manageGamePause();
    this.littleMuncherScene.subscribe(
      this.littleMuncherScene.communicator.pause?.onWithInitial(
        this.manageGamePause,
        (event) => (this.littleMuncherScene.gameState.data.pause = event.pause)
      )
    );
  }

  private manageGamePause = () => {
    const pause = this.littleMuncherScene.gameState.data.pause;
    if (pause) {
      this.littleMuncherScene.scene.pause();
    } else {
      this.littleMuncherScene.scene.resume();
    }
  };
}
