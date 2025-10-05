// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import HudProbableWaffle from "../../../../world/scenes/hud-scenes/HudProbableWaffle";
import { ProbableWaffleScene } from "../../../../core/probable-waffle.scene";
import { getPlayer } from "../../../../data/scene-data";
import { getSceneSystem } from "../../../../world/services/scene-component-helpers";
import { AiPlayerHandler } from "../../../../player/ai-controller/ai-player-handler";
/* END-USER-IMPORTS */

export default class AiControllerDebugLabel extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 200.15978001501432, y ?? 0);

    // playerName
    const playerName = scene.add.text(-0.15977986418442924, 6, "", {});
    playerName.setOrigin(1, 0);
    playerName.text = "Player Name";
    playerName.setStyle({
      align: "right",
      fontFamily: "disposabledroid",
      fontSize: "22px",
      maxLines: 1,
      resolution: 10
    });
    playerName.setWordWrapWidth(200);
    this.add(playerName);

    // playerAction
    const playerAction = scene.add.text(-0.15977986418442924, 34, "", {});
    playerAction.setOrigin(1, 0);
    playerAction.text = "Player action";
    playerAction.setStyle({
      align: "right",
      fontFamily: "disposabledroid",
      fontSize: "20px",
      maxLines: 1,
      resolution: 10
    });
    playerAction.setWordWrapWidth(200);
    this.add(playerAction);

    // telemetryText
    const telemetryText = scene.add.text(-0.15977986418442924, 60, "", {});
    telemetryText.setOrigin(1, 0);
    telemetryText.text = "Telemetry";
    telemetryText.setStyle({
      align: "right",
      fontFamily: "disposabledroid",
      fontSize: "20px",
      maxLines: 12,
      resolution: 10,
      lineSpacing: 4
    });
    telemetryText.setWordWrapWidth(240);
    this.add(telemetryText);

    this.playerName = playerName;
    this.playerAction = playerAction;
    this.telemetryText = telemetryText;

    /* START-USER-CTR-CODE */
    this.mainSceneWithActors = (this.scene as HudProbableWaffle).probableWaffleScene!;
    /* END-USER-CTR-CODE */
  }

  private playerName: Phaser.GameObjects.Text;
  private playerAction: Phaser.GameObjects.Text;
  private telemetryText: Phaser.GameObjects.Text;

  /* START-USER-CODE */
  private readonly mainSceneWithActors: ProbableWaffleScene;
  private playerNum?: number;
  private lastTelemetryAt = 0; // throttle
  private readonly telemetryIntervalMs = 1000;

  setPlayer(playerNumber: number) {
    this.playerNum = playerNumber;
    const player = getPlayer(this.mainSceneWithActors, playerNumber);
    if (player) {
      this.playerName.text = "Player " + playerNumber;
      const aiHandlerSystem = getSceneSystem(this.mainSceneWithActors, AiPlayerHandler);
      const controller = aiHandlerSystem?.getAiPlayerController(playerNumber);
      this.playerAction.text = controller?.blackboard.currentStrategy || "";
      this.refreshTelemetry(performance.now());
    } else {
      this.playerName.text = "No Player";
      this.playerAction.text = "";
      this.telemetryText.text = "";
    }
  }

  refreshTelemetry(now: number) {
    if (!this.playerNum) return;
    if (now - this.lastTelemetryAt < this.telemetryIntervalMs) return;
    this.lastTelemetryAt = now;
    const aiHandlerSystem = getSceneSystem(this.mainSceneWithActors, AiPlayerHandler);
    const controller = aiHandlerSystem?.getAiPlayerController(this.playerNum);
    if (!controller) return;
    const snap: any = controller.getTelemetrySnapshot?.() || controller.telemetry?.snapshot?.();
    const bb = controller.blackboard;

    // Build spans summary (top 3 by avg)
    const spanEntries = Object.entries(snap?.spans || {});
    spanEntries.sort((a: any, b: any) => b[1].avg - a[1].avg);
    const topSpans = spanEntries.slice(0, 3).map(([k, v]: any) => `${k}:${v.last.toFixed(1)}ms`);

    // Counters summary (first few)
    const counterEntries = Object.entries(snap?.counters || {})
      .slice(0, 4)
      .map(([k, v]) => `${k}:${v}`);

    const lines: string[] = [];
    lines.push(`frame:${snap?.frame ?? 0}`);
    lines.push(`units:${bb.units.length} wrk:${bb.workers.length} visE:${bb.visibleEnemies.length}`);
    lines.push(
      `supply:${bb.production.supply.used}/${bb.production.supply.max || 0} (+${bb.production.supply.pendingFromQueued})`
    );
    lines.push(`strat:${bb.currentStrategy}`);
    if (topSpans.length) lines.push(`spans ${topSpans.join(" ")}`);
    if (counterEntries.length) lines.push(`cnt ${counterEntries.join(" ")}`);

    this.telemetryText.text = lines.join("\n");
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
