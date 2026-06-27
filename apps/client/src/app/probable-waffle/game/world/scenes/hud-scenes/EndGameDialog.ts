// You can write more code here

/* START OF COMPILED CODE */

import OnPointerUpScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerUpScript";
import EmitEventActionScript from "../../../../../shared/game/phaser/script-nodes-basic/EmitEventActionScript";
import OnPointerDownScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
import PushActionScript from "../../../../../shared/game/phaser/script-nodes/PushActionScript";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class EndGameDialog extends Phaser.Scene {
  constructor() {
    super("EndGameDialog");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {
    // dialog_container
    const dialog_container = this.add.container(0, 0);

    // game_actions_bg
    const game_actions_bg = this.add.nineslice(
      -112.60605580401727,
      -190.29550515717648,
      "gui",
      "cryos_mini_gui/surfaces/surface_dark.png",
      20,
      25,
      1,
      1,
      1,
      1
    );
    game_actions_bg.scaleX = 10.948325638168216;
    game_actions_bg.scaleY = 10.305188906705764;
    game_actions_bg.setOrigin(0, 0);
    dialog_container.add(game_actions_bg);

    // continue_button
    const continue_button = this.add.container(-5, 22);
    continue_button.setInteractive(
      new Phaser.Geom.Rectangle(-42, -13, 85.7117848223629, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );
    continue_button.scaleX = 2;
    continue_button.scaleY = 2;
    dialog_container.add(continue_button);

    // game_actions_quit_bg_2
    const game_actions_quit_bg_2 = this.add.nineslice(
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
    game_actions_quit_bg_2.scaleX = 2.3521289589041787;
    game_actions_quit_bg_2.scaleY = 1.5492262688240692;
    continue_button.add(game_actions_quit_bg_2);

    // text_1
    const text_1 = this.add.text(-1, 0, "", {});
    text_1.setOrigin(0.5, 0.5);
    text_1.text = "Continue";
    text_1.setStyle({
      align: "center",
      color: "#000000ff",
      fontFamily: "disposabledroid",
      fontSize: "18px",
      stroke: "#ffffffff",
      resolution: 10
    });
    continue_button.add(text_1);

    // onPointerUpScript_continue
    const onPointerUpScript_continue = new OnPointerUpScript(continue_button);

    // emitEventContinueAction
    const emitEventContinueAction = new EmitEventActionScript(onPointerUpScript_continue);

    // onPointerDownScript_continue
    const onPointerDownScript_continue = new OnPointerDownScript(continue_button);

    // continue_click
    new PushActionScript(onPointerDownScript_continue);

    // message
    const message = this.add.text(-95, -96, "", {});
    message.setOrigin(0, 0.5);
    message.setStyle({
      align: "center",
      color: "#ffffffff",
      fontFamily: "disposabledroid",
      fontSize: "32px",
      maxLines: 5,
      resolution: 10
    });
    message.setWordWrapWidth(200);
    dialog_container.add(message);

    // emitEventContinueAction (prefab fields)
    emitEventContinueAction.eventName = "continue";

    this.continue_button = continue_button;
    this.message = message;
    this.dialog_container = dialog_container;

    this.events.emit("scene-awake");
  }

  private continue_button!: Phaser.GameObjects.Container;
  private message!: Phaser.GameObjects.Text;
  private dialog_container!: Phaser.GameObjects.Container;

  /* START-USER-CODE */
  private readonly smallScreenBreakpoint = 800;
  private callback: (() => void) | null = null;

  // noinspection JSUnusedGlobalSymbols
  create() {
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
  setCallback(callback: () => void) {
    this.callback = callback;
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
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
