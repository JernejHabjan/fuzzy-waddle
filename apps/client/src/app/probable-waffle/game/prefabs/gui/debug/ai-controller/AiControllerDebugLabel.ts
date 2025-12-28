// You can write more code here

/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
import HudProbableWaffle from "../../../../world/scenes/hud-scenes/HudProbableWaffle";
import { ProbableWaffleScene } from "../../../../core/probable-waffle.scene";
import { getPlayer } from "../../../../data/scene-data";
import { getSceneSystem } from "../../../../world/services/scene-component-helpers";
import { AiPlayerHandler } from "../../../../player/ai-controller/ai-player-handler";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
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
    const bb = controller.blackboard;
    const agent = controller.playerAiControllerAgent;

    const lines: string[] = [];

    // Strategy
    lines.push(`--- Strategy: ${bb.currentStrategy} ---`);
    const attackPowerRatio = bb.getAttackPowerRatio(now);
    lines.push(`Atk Power Ratio: ${attackPowerRatio.toFixed(2)}`);
    const militaryPowerThreshold = agent.adaptiveThresholds.getMilitaryPowerThreshold();
    lines.push(`Military Power Threshold: ${militaryPowerThreshold}`);
    const baseHeavyAttackThreshold = agent.adaptiveThresholds.getBaseHeavyAttackThreshold();
    lines.push(`Base Heavy Attack Threshold: ${baseHeavyAttackThreshold}`);

    // Resources
    lines.push("--- Resources ---");
    for (const key in bb.resources) {
      const r = key as ResourceType;
      const incomeI = bb.economy.incomeInstant[r]?.toFixed(1) ?? "N/A";
      const incomeS = bb.economy.incomeSmoothed[r]?.toFixed(1) ?? "N/A";
      lines.push(`${r}: ${bb.resources[r]} (i: ${incomeI}, s: ${incomeS})`);
    }

    // Building
    lines.push("--- Building ---");
    const reserved = agent.basePlanner.getReservedBuilding();
    if (reserved) {
      lines.push(`Reserved: ${reserved.objectName} at ${reserved.tile.x},${reserved.tile.y}`);
    }
    const needs = agent.basePlanner.getCurrentNeeds();
    if (needs.length > 0) {
      const need = needs[0]!;
      lines.push(`Need: ${need.type} (${need.reason})`);
    }

    // Enemy Intel
    lines.push("--- Enemy Intel ---");
    for (const player in bb.enemyIntel) {
      const intel = bb.enemyIntel[player]!;
      lines.push(`P${player}: Str ${intel.strength.toFixed(0)}`);
    }
    if (bb.primaryTarget) {
      lines.push(`Target: ${bb.primaryTarget.name}`);
    }

    this.telemetryText.text = lines.join("\\n");
    this.playerAction.text = controller?.blackboard.currentStrategy || "";
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
