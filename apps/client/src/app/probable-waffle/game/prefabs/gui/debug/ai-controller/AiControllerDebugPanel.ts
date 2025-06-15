// You can write more code here

/* START OF COMPILED CODE */

import OnPointerDownScript from "../../../../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
import PushActionScript from "../../../../../../shared/game/phaser/script-nodes/PushActionScript";
import OnPointerUpScript from "../../../../../../shared/game/phaser/script-nodes-basic/OnPointerUpScript";
import EmitEventActionScript from "../../../../../../shared/game/phaser/script-nodes-basic/EmitEventActionScript";
import AiControllerDebugLabel from "./AiControllerDebugLabel";
/* START-USER-IMPORTS */
import { getPlayers } from "../../../../data/scene-data";
import HudProbableWaffle from "../../../../scenes/HudProbableWaffle";
import { ProbableWafflePlayerType } from "@fuzzy-waddle/api-interfaces";
import { getSceneService } from "../../../../scenes/components/scene-component-helpers";
import { DebuggingService } from "../../../../scenes/services/DebuggingService";
/* END-USER-IMPORTS */

export default class AiControllerDebugPanel extends Phaser.GameObjects.Container {

  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 200.21157284311968, y ?? 0);

    // button
    const button = scene.add.container(-150.21157898014727, 15);
    button.setInteractive(new Phaser.Geom.Rectangle(-32, -13, 182.0350429198294, 25.429332302435576), Phaser.Geom.Rectangle.Contains);
    this.add(button);

    // game_action_bg
    const game_action_bg = scene.add.nineslice(60, 0, "gui", "cryos_mini_gui/buttons/button_small.png", 90, 20, 3, 3, 3, 3);
    game_action_bg.scaleX = 2.0762647352357817;
    game_action_bg.scaleY = 1.5492262688240692;
    button.add(game_action_bg);

    // buttonText
    const buttonText = scene.add.text(69.74578515529078, -1, "", {});
    buttonText.setOrigin(0.5472303972883584, 0.5);
    buttonText.text = "Show AI debugging";
    buttonText.setStyle({ "color": "#000000ff", "fontFamily": "ARCADECLASSIC", "resolution": 10 });
    button.add(buttonText);

    // onPointerDownScript
    const onPointerDownScript = new OnPointerDownScript(button);

    // actor_action_click
    new PushActionScript(onPointerDownScript);

    // onPointerUpScript_menu_9
    const onPointerUpScript_menu_9 = new OnPointerUpScript(button);

    // emitActorAction
    const emitActorAction = new EmitEventActionScript(onPointerUpScript_menu_9);

    // aiControllerDebugLabel
    const aiControllerDebugLabel = new AiControllerDebugLabel(scene, 0, 32);
    this.add(aiControllerDebugLabel);

    // emitActorAction (prefab fields)
    emitActorAction.eventName = "action";

    this.buttonText = buttonText;
    this.button = button;
    this.aiControllerDebugLabel = aiControllerDebugLabel;

    /* START-USER-CTR-CODE */
    this.init();
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    /* END-USER-CTR-CODE */
  }

  private buttonText: Phaser.GameObjects.Text;
  private button: Phaser.GameObjects.Container;
  private aiControllerDebugLabel: AiControllerDebugLabel;

  /* START-USER-CODE */
  private enabled = false;
  private labels: AiControllerDebugLabel[] = [];
  private init() {
    this.button.on("action", this.toggleLabels, this);
    this.aiControllerDebugLabel.destroy();
  }

  private toggleLabels() {
    this.enabled = !this.enabled;
    this.buttonText.text = this.enabled ? "Hide AI debugging" : "Show AI debugging";
    const aiDebuggingService = getSceneService(this.mainScene, DebuggingService);
    if (aiDebuggingService) {
      aiDebuggingService.debug = this.enabled;
      aiDebuggingService.debugChanged.next(this.enabled);
    }

    if (this.enabled) {
      this.aiControllerDebugLabel.setVisible(true);
      const buttonHeight = this.button.getBounds().height;
      const aiPlayers = getPlayers(this.mainScene).filter(
        (p) => p.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.AI
      );
      // create new labels for each ai player and put them below the button
      let currentY = buttonHeight;
      aiPlayers.forEach((player) => {
        const aiControllerDebugLabel = new AiControllerDebugLabel(this.scene, 0, currentY);
        aiControllerDebugLabel.setPlayer(player.playerNumber!);
        this.add(aiControllerDebugLabel);
        currentY += aiControllerDebugLabel.getBounds().height;
        this.labels.push(aiControllerDebugLabel);
      });
    } else {
      this.aiControllerDebugLabel.setVisible(false);
      this.labels.forEach((label) => label.destroy());
    }
  }

  get mainScene() {
    return (this.scene as HudProbableWaffle).probableWaffleScene!;
  }

  destroy() {
    this.button.off("action", this.toggleLabels, this);
    this.labels.forEach((label) => label.destroy());
    super.destroy();
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
