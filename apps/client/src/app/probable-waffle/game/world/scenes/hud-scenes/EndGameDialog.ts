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

export default class EndGameDialog extends ProbableWaffleScene {
  constructor() {
    super("EndGameDialog");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {
    // dialog_container
    const dialog_container = this.add.container(0, 0);

    // dialog_bg
    const dialog_bg = this.add.nineslice(
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
    dialog_bg.scaleX = 18;
    dialog_bg.scaleY = 14;
    dialog_bg.setOrigin(0, 0);
    dialog_container.add(dialog_bg);

    // title
    const title = this.add.text(0, -100, "", {});
    title.setOrigin(0.5, 0.5);
    title.text = "Victory!";
    title.setStyle({
      align: "center",
      color: "#FFD700ff",
      fontFamily: "disposabledroid",
      fontSize: "48px",
      resolution: 10
    });
    dialog_container.add(title);

    // message
    const message = this.add.text(0, -20, "", {});
    message.setOrigin(0.5, 0.5);
    message.text = "You are the last player remaining!";
    message.setStyle({
      align: "center",
      color: "#ffffffff",
      fontFamily: "disposabledroid",
      fontSize: "24px",
      resolution: 10
    });
    dialog_container.add(message);

    // continue_button
    const continue_button = this.add.container(0, 80);
    continue_button.setInteractive(new Phaser.Geom.Rectangle(-60, -15, 120, 30), Phaser.Geom.Rectangle.Contains);
    continue_button.scaleX = 2;
    continue_button.scaleY = 2;
    dialog_container.add(continue_button);

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
    emitEventContinue.eventName = "continue";

    this.continue_button = continue_button;
    this.dialog_container = dialog_container;
    this.message = message;

    this.events.emit("scene-awake");
  }

  private continue_button!: Phaser.GameObjects.Container;
  private dialog_container!: Phaser.GameObjects.Container;
  private message!: Phaser.GameObjects.Text;

  /* START-USER-CODE */
  private readonly smallScreenBreakpoint = 800;
  private callback: (() => void) | null = null;

  override create() {
    this.editorCreate();

    // resize the scene to match the screen size
    this.scale.on("resize", this.resize, this);
    this.resize({ height: this.scale.height, width: this.scale.width });

    this.addBackgroundOverlay();
    this.handleContinue();
  }

  setMessage(message: string) {
    this.message.text = message;
  }

  private resize(gameSize: { width: number; height: number }) {
    // set dialog to center
    this.dialog_container.setPosition(gameSize.width / 2, gameSize.height / 2);

    const sceneWidth = this.scale.width;
    this.dialog_container.scale = sceneWidth > this.smallScreenBreakpoint ? 1 : 0.8;
  }

  private addBackgroundOverlay() {
    const bgOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.5);
    bgOverlay.setOrigin(0, 0);
    bgOverlay.setDepth(-1);
    bgOverlay.setInteractive();
    // Prevent closing on background click for dialog
  }

  private handleContinue() {
    this.continue_button.once("continue", () => {
      // Navigate to score screen
      if (this.callback) {
        this.callback();
      }
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
  setCallback(callback: () => void) {
    this.callback = callback;
  }
}

/* END OF COMPILED CODE */

// You can write more code here
