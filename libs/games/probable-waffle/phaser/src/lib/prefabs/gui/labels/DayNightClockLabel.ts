// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { SceneLightingService } from "../../../world/services/lighting/scene-lighting.service";
/* END-USER-IMPORTS */

export default class DayNightClockLabel extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 13, y ?? 692);

    // clockText
    const clockText = scene.add.text(0, 0, "", {});
    clockText.setOrigin(0, 1);
    clockText.setStyle({
      color: "#ffffffff",
      fontFamily: "disposabledroid",
      fontSize: "18px",
      stroke: "#000000ff",
      strokeThickness: 3,
      resolution: 10
    });
    this.add(clockText);

    this.clockText = clockText;

    /* START-USER-CTR-CODE */
    this.visible = false;
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.handleSceneUpdate, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    /* END-USER-CTR-CODE */
  }

  private clockText: Phaser.GameObjects.Text;

  /* START-USER-CODE */
  private probableWaffleScene?: ProbableWaffleScene;
  private readonly refreshIntervalMs = 100;
  private accumulatorMs = 0;
  private lastText = "";

  initializeWithParentScene(probableWaffleScene: ProbableWaffleScene): void {
    this.probableWaffleScene = probableWaffleScene;
    this.refreshClock(true);
  }

  private handleSceneUpdate(_time: number, delta: number): void {
    this.accumulatorMs += delta;
    if (this.accumulatorMs < this.refreshIntervalMs) {
      return;
    }

    this.accumulatorMs = 0;
    this.refreshClock();
  }

  /**
   * Mirrors the current normalized day/night display text from the world lighting service.
   */
  private refreshClock(force: boolean = false): void {
    const lightingService = this.probableWaffleScene
      ? getSceneService(this.probableWaffleScene, SceneLightingService)
      : undefined;
    const clockState = lightingService?.getDayNightClockState();
    const nextVisible = clockState?.enabled ?? false;
    const nextText = nextVisible ? (clockState?.displayText ?? "") : "";

    this.visible = nextVisible;
    if (!nextVisible) {
      this.lastText = "";
      return;
    }

    if (!force && this.lastText === nextText) {
      return;
    }

    this.clockText.setText(nextText);
    this.lastText = nextText;
  }

  override destroy(fromScene?: boolean): void {
    this.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.handleSceneUpdate, this);
    super.destroy(fromScene);
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
