import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import GameProbableWaffleScene from "../GameProbableWaffleScene";

type SceneBootOverlayInitData = {
  gameSceneKey: string;
};

const PRELOAD_BACKGROUND_COLOR = 0x222222;

/**
 * Top-most startup mask that keeps the screen shaded until the world scene, lighting setup,
 * and one additional update tick have all completed. The fade-out is intentionally short so
 * the player never sees partially initialized lighting or late-spawning UI.
 */
export default class SceneBootOverlayScene extends ProbableWaffleScene {
  static readonly SceneKey = "SceneBootOverlayScene";

  private overlay?: Phaser.GameObjects.Rectangle;
  private gameSceneKey?: string;
  private gameScene?: Phaser.Scene;
  private bootstrapReady = false;
  private lightingReady = false;
  private waitingForFinalFrame = false;
  private fadeStarted = false;

  constructor() {
    super(SceneBootOverlayScene.SceneKey);
  }

  override init(data?: SceneBootOverlayInitData): void {
    this.gameSceneKey = data?.gameSceneKey;
  }

  override create(): void {
    this.gameScene = this.gameSceneKey ? this.scene.get(this.gameSceneKey) : undefined;

    this.overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, PRELOAD_BACKGROUND_COLOR, 1);
    this.overlay.setOrigin(0, 0);
    this.overlay.setScrollFactor(0);
    this.overlay.setDepth(10_000);

    this.scale.on("resize", this.resizeOverlay, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroyOverlay, this);

    if (!this.gameScene) {
      this.beginFadeOut();
      return;
    }

    this.bootstrapReady =
      this.gameScene.data.get(GameProbableWaffleScene.BootOverlayBootstrapReadyDataKey) === true;
    this.lightingReady =
      this.gameScene.data.get(GameProbableWaffleScene.BootOverlayLightingReadyDataKey) === true;

    this.gameScene.events.on(Phaser.Scenes.Events.UPDATE, this.onGameSceneUpdate, this);
    this.gameScene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.stopOnParentShutdown, this);
    this.gameScene.data.events.on(
      `changedata-${GameProbableWaffleScene.BootOverlayBootstrapReadyDataKey}`,
      this.onBootstrapReadyChanged,
      this
    );
    this.gameScene.data.events.on(
      `changedata-${GameProbableWaffleScene.BootOverlayLightingReadyDataKey}`,
      this.onLightingReadyChanged,
      this
    );

    this.maybeQueueFadeOut();
  }

  private resizeOverlay(gameSize: Phaser.Structs.Size | { width: number; height: number }): void {
    this.overlay?.setSize(gameSize.width, gameSize.height);
  }

  private onBootstrapReadyChanged(
    _parent: Phaser.Data.DataManager,
    value: boolean
  ): void {
    this.bootstrapReady = value === true;
    this.maybeQueueFadeOut();
  }

  private onLightingReadyChanged(
    _parent: Phaser.Data.DataManager,
    value: boolean
  ): void {
    this.lightingReady = value === true;
    this.maybeQueueFadeOut();
  }

  /**
   * Waits for one additional world-scene update after bootstrap and lighting are ready so the
   * first visible frame already contains the fully initialized scene state.
   */
  private maybeQueueFadeOut(): void {
    if (!this.bootstrapReady || !this.lightingReady || this.waitingForFinalFrame || this.fadeStarted) {
      return;
    }

    this.waitingForFinalFrame = true;
  }

  private onGameSceneUpdate(): void {
    if (!this.waitingForFinalFrame || this.fadeStarted) return;
    this.waitingForFinalFrame = false;
    this.beginFadeOut();
  }

  private beginFadeOut(): void {
    if (!this.overlay || this.fadeStarted) return;
    this.fadeStarted = true;

    this.tweens.add({
      targets: this.overlay,
      alpha: 0,
      duration: 150,
      ease: "Quad.easeOut",
      onComplete: () => {
        this.scene.stop();
      }
    });
  }

  private stopOnParentShutdown(): void {
    this.scene.stop();
  }

  private destroyOverlay(): void {
    this.scale.off("resize", this.resizeOverlay, this);

    if (this.gameScene) {
      this.gameScene.events.off(Phaser.Scenes.Events.UPDATE, this.onGameSceneUpdate, this);
      this.gameScene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.stopOnParentShutdown, this);
      this.gameScene.data.events.off(
        `changedata-${GameProbableWaffleScene.BootOverlayBootstrapReadyDataKey}`,
        this.onBootstrapReadyChanged,
        this
      );
      this.gameScene.data.events.off(
        `changedata-${GameProbableWaffleScene.BootOverlayLightingReadyDataKey}`,
        this.onLightingReadyChanged,
        this
      );
    }

    this.overlay?.destroy();
    this.overlay = undefined;
    this.gameScene = undefined;
  }
}
