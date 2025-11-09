// You can write more code here

/* START OF COMPILED CODE */

import OnPointerUpScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerUpScript";
import EmitEventActionScript from "../../../../../shared/game/phaser/script-nodes-basic/EmitEventActionScript";
import OnPointerDownScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
import PushActionScript from "../../../../../shared/game/phaser/script-nodes/PushActionScript";
/* START-USER-IMPORTS */
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { GameSessionState } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class VictoryDialog extends ProbableWaffleScene {
  constructor() {
    super("VictoryDialog");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {
    // victory_dialog_container
    const victory_dialog_container = this.add.container(0, 0);

    // victory_dialog_bg
    const victory_dialog_bg = this.add.nineslice(
      -200,
      -150,
      "gui",
      "cryos_mini_gui/surfaces/surface_dark.png",
      20,
      40,
      1,
      1,
      1,
      1
    );
    victory_dialog_bg.scaleX = 18;
    victory_dialog_bg.scaleY = 14;
    victory_dialog_bg.setOrigin(0, 0);
    victory_dialog_container.add(victory_dialog_bg);

    // victory_title
    const victory_title = this.add.text(0, -100, "", {});
    victory_title.setOrigin(0.5, 0.5);
    victory_title.text = "Victory!";
    victory_title.setStyle({
      align: "center",
      color: "#FFD700ff",
      fontFamily: "disposabledroid",
      fontSize: "48px",
      resolution: 10
    });
    victory_dialog_container.add(victory_title);

    // victory_message
    const victory_message = this.add.text(0, -20, "", {});
    victory_message.setOrigin(0.5, 0.5);
    victory_message.text = "You are the last player remaining!";
    victory_message.setStyle({
      align: "center",
      color: "#ffffffff",
      fontFamily: "disposabledroid",
      fontSize: "24px",
      resolution: 10
    });
    victory_dialog_container.add(victory_message);

    // continue_button
    const continue_button = this.add.container(0, 80);
    continue_button.setInteractive(
      new Phaser.Geom.Rectangle(-60, -15, 120, 30),
      Phaser.Geom.Rectangle.Contains
    );
    continue_button.scaleX = 2;
    continue_button.scaleY = 2;
    victory_dialog_container.add(continue_button);

    // continue_button_bg
    const continue_button_bg = this.add.nineslice(
      0,
      0,
      "gui",
      "cryos_mini_gui/buttons/button_small.png",
      40,
      20,
      3,
      3,
      3,
      3
    );
    continue_button_bg.scaleX = 3.2;
    continue_button_bg.scaleY = 1.8;
    continue_button.add(continue_button_bg);

    // continue_text
    const continue_text = this.add.text(0, 0, "", {});
    continue_text.setOrigin(0.5, 0.5);
    continue_text.text = "View Score Screen";
    continue_text.setStyle({
      align: "center",
      color: "#000000ff",
      fontFamily: "disposabledroid",
      fontSize: "18px",
      resolution: 10
    });
    continue_button.add(continue_text);

    // onPointerUpScript_continue
    const onPointerUpScript_continue = new OnPointerUpScript(continue_button);

    // emitEventContinue
    const emitEventContinue = new EmitEventActionScript(onPointerUpScript_continue);

    // onPointerDownScript_continue
    const onPointerDownScript_continue = new OnPointerDownScript(continue_button);

    // continue_click
    new PushActionScript(onPointerDownScript_continue);

    // emitEventContinue (prefab fields)
    emitEventContinue.eventName = "victory-continue";

    this.continue_button = continue_button;
    this.victory_dialog_container = victory_dialog_container;
    this.victory_message = victory_message;

    this.events.emit("scene-awake");
  }

  private continue_button!: Phaser.GameObjects.Container;
  private victory_dialog_container!: Phaser.GameObjects.Container;
  private victory_message!: Phaser.GameObjects.Text;

  /* START-USER-CODE */
  private readonly smallScreenBreakpoint = 800;

  override create() {
    this.editorCreate();

    // resize the scene to match the screen size
    this.scale.on("resize", this.resize, this);
    this.resize({ height: this.scale.height, width: this.scale.width });

    this.addBackgroundOverlay();
    this.handleContinue();
  }

  setVictoryMessage(message: string) {
    this.victory_message.text = message;
  }

  private resize(gameSize: { width: number; height: number }) {
    // set victory dialog to center
    this.victory_dialog_container.setPosition(gameSize.width / 2, gameSize.height / 2);

    const sceneWidth = this.scale.width;
    this.victory_dialog_container.scale = sceneWidth > this.smallScreenBreakpoint ? 1 : 0.8;
  }

  private addBackgroundOverlay() {
    const bgOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.5);
    bgOverlay.setOrigin(0, 0);
    bgOverlay.setDepth(-1);
    bgOverlay.setInteractive();
    // Prevent closing on background click for victory dialog
  }

  private handleContinue() {
    this.continue_button.once("victory-continue", () => {
      // Navigate to score screen
      this.communicator.gameInstanceMetadataChanged?.send({
        property: "sessionState",
        gameInstanceId: this.baseGameData.gameInstance.gameInstanceMetadata.data.gameInstanceId!,
        data: { sessionState: GameSessionState.ToScoreScreen },
        emitterUserId: this.baseGameData.user.userId
      });
      this.destroySelf();
    });
  }

  private destroySelf() {
    this.scene.stop();
  }

  override destroy() {
    super.destroy();
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
