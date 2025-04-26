import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getSceneService } from "../../../scenes/components/scene-component-helpers";
import { CrossSceneCommunicationService } from "../../../scenes/services/CrossSceneCommunicationService";

export enum HudVisualFeedbackMessageType {
  NotEnoughResources,
  ProductionQueueFull,
  CannotAssignRepairer,
  CannotAssignBuilder
}
/* START OF COMPILED CODE */

/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class HudMessages extends Phaser.GameObjects.Text {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 0, y ?? 50, "", {});

    this.setOrigin(0, 1);
    this.text = "HUD Text";
    this.setStyle({
      fontFamily: "Tahoma",
      fontSize: "20px",
      maxLines: 3,
      stroke: "#000000ff",
      strokeThickness: 3,
      resolution: 4
    });
    this.setWordWrapWidth(256);

    /* START-USER-CTR-CODE */
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  private delayedCall?: Phaser.Time.TimerEvent;
  private crossSceneCommunicationService?: CrossSceneCommunicationService;

  setup(probableWaffleScene: ProbableWaffleScene) {
    this.setText("");
    if (this.scene.game.scale.width < 1200) {
      this.setStyle({ fontSize: "16px" });
    }
    const crossSceneCommunicationService = getSceneService(probableWaffleScene, CrossSceneCommunicationService);
    this.crossSceneCommunicationService = crossSceneCommunicationService;
    crossSceneCommunicationService?.on(HudMessages.HudVisualFeedbackMessageEventName, this.messageEvent);
  }

  static HudVisualFeedbackMessageEventName = "hud-visual-feedback-message";

  private static messageTexts = {
    [HudVisualFeedbackMessageType.NotEnoughResources]: {
      text: "Not enough resources",
      severity: "warning"
    },
    [HudVisualFeedbackMessageType.ProductionQueueFull]: {
      text: "Production queue full",
      severity: "warning"
    },
    [HudVisualFeedbackMessageType.CannotAssignRepairer]: {
      text: "Cannot assign repairer",
      severity: "warning"
    },
    [HudVisualFeedbackMessageType.CannotAssignBuilder]: {
      text: "Cannot assign builder",
      severity: "warning"
    }
  } as const;

  private messageEvent = (messageType: HudVisualFeedbackMessageType) => {
    this.displayMessage(messageType);
  };

  private displayMessage(messageType: HudVisualFeedbackMessageType) {
    this.setText(HudMessages.messageTexts[messageType].text);
    const severity = HudMessages.messageTexts[messageType].severity;
    const color = severity === "warning" ? "#FFA500" : severity === "error" ? "#FF0000" : "#FFFFFF";
    this.setStyle({ fill: color });
    if (this.delayedCall) this.delayedCall.destroy();
    this.delayedCall = this.scene.time.delayedCall(5000, () => {
      this.setText("");
    });
  }

  destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    if (this.delayedCall) this.delayedCall.destroy();
    this.crossSceneCommunicationService?.off(HudMessages.HudVisualFeedbackMessageEventName, this.messageEvent);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */
