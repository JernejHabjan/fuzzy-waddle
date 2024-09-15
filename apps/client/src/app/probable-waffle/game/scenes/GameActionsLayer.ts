// You can write more code here

/* START OF COMPILED CODE */

import OnPointerUpScript from "../../../shared/game/phaser/script-nodes-basic/OnPointerUpScript";
import EmitEventActionScript from "../../../shared/game/phaser/script-nodes-basic/EmitEventActionScript";
import OnPointerDownScript from "../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
import PushActionScript from "../../../shared/game/phaser/script-nodes/PushActionScript";
/* START-USER-IMPORTS */
import { ProbableWaffleScene } from "../core/probable-waffle.scene";
import { GameSessionState } from "@fuzzy-waddle/api-interfaces";
/* END-USER-IMPORTS */

export default class GameActionsLayer extends ProbableWaffleScene {

  constructor() {
    super("GameActionsLayer");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {

    // game_actions_container
    const game_actions_container = this.add.container(0, 0);

    // game_actions_bg
    const game_actions_bg = this.add.nineslice(-112.60605580401727, -190.29550515717648, "gui", "cryos_mini_gui/surfaces/surface_dark.png", 20, 40, 1, 1, 1, 1);
    game_actions_bg.scaleX = 10.948325638168216;
    game_actions_bg.scaleY = 10.305188906705764;
    game_actions_bg.setOrigin(0, 0);
    game_actions_container.add(game_actions_bg);

    // game_action_quit
    const game_action_quit = this.add.container(-0.6060558040172737, 177.70449484282352);
    game_action_quit.setInteractive(new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576), Phaser.Geom.Rectangle.Contains);
    game_action_quit.scaleX = 2;
    game_action_quit.scaleY = 2;
    game_actions_container.add(game_action_quit);

    // game_actions_quit_bg_3
    const game_actions_quit_bg_3 = this.add.nineslice(0, 0, "gui", "cryos_mini_gui/buttons/button_small.png", 40, 20, 3, 3, 3, 3);
    game_actions_quit_bg_3.scaleX = 2.3521289589041787;
    game_actions_quit_bg_3.scaleY = 1.5492262688240692;
    game_action_quit.add(game_actions_quit_bg_3);

    // text_3
    const text_3 = this.add.text(-1, 0, "", {});
    text_3.setOrigin(0.5, 0.5);
    text_3.text = "Quit";
    text_3.setStyle({ "align": "center", "color": "#000000ff", "fontSize": "14px" });
    game_action_quit.add(text_3);

    // onPointerUpScript_quit
    const onPointerUpScript_quit = new OnPointerUpScript(game_action_quit);

    // emitEventQuit
    const emitEventQuit = new EmitEventActionScript(onPointerUpScript_quit);

    // onPointerDownScript_quit
    const onPointerDownScript_quit = new OnPointerDownScript(game_action_quit);

    // quit_click
    new PushActionScript(onPointerDownScript_quit);

    // game_action_load
    const game_action_load = this.add.container(-1.6060558040172737, 112.70449484282352);
    game_action_load.setInteractive(new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576), Phaser.Geom.Rectangle.Contains);
    game_action_load.scaleX = 2;
    game_action_load.scaleY = 2;
    game_actions_container.add(game_action_load);

    // game_actions_quit_bg_4
    const game_actions_quit_bg_4 = this.add.nineslice(0, 0, "gui", "cryos_mini_gui/buttons/button_small.png", 40, 20, 3, 3, 3, 3);
    game_actions_quit_bg_4.scaleX = 2.3521289589041787;
    game_actions_quit_bg_4.scaleY = 1.5492262688240692;
    game_action_load.add(game_actions_quit_bg_4);

    // text_4
    const text_4 = this.add.text(-1, 0, "", {});
    text_4.setOrigin(0.5, 0.5);
    text_4.text = "Load";
    text_4.setStyle({ "align": "center", "color": "#000000ff", "fontSize": "14px" });
    game_action_load.add(text_4);

    // onPointerUpScript_load
    const onPointerUpScript_load = new OnPointerUpScript(game_action_load);

    // emitEventLoad
    const emitEventLoad = new EmitEventActionScript(onPointerUpScript_load);

    // onPointerDownScript_load
    const onPointerDownScript_load = new OnPointerDownScript(game_action_load);

    // load_click
    new PushActionScript(onPointerDownScript_load);

    // game_action_save
    const game_action_save = this.add.container(-2.6060558040172737, 46.70449484282352);
    game_action_save.setInteractive(new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576), Phaser.Geom.Rectangle.Contains);
    game_action_save.scaleX = 2;
    game_action_save.scaleY = 2;
    game_actions_container.add(game_action_save);

    // game_actions_quit_bg_5
    const game_actions_quit_bg_5 = this.add.nineslice(0, 0, "gui", "cryos_mini_gui/buttons/button_small.png", 40, 20, 3, 3, 3, 3);
    game_actions_quit_bg_5.scaleX = 2.3521289589041787;
    game_actions_quit_bg_5.scaleY = 1.5492262688240692;
    game_action_save.add(game_actions_quit_bg_5);

    // text_5
    const text_5 = this.add.text(-1, 0, "", {});
    text_5.setOrigin(0.5, 0.5);
    text_5.text = "Save";
    text_5.setStyle({ "align": "center", "color": "#000000ff", "fontSize": "14px" });
    game_action_save.add(text_5);

    // onPointerUpScript_save
    const onPointerUpScript_save = new OnPointerUpScript(game_action_save);

    // emitEventSaveAction
    const emitEventSaveAction = new EmitEventActionScript(onPointerUpScript_save);

    // onPointerDownScript_save
    const onPointerDownScript_save = new OnPointerDownScript(game_action_save);

    // save_click
    new PushActionScript(onPointerDownScript_save);

    // game_action_settings
    const game_action_settings = this.add.container(-2.6060558040172737, -16.29550515717648);
    game_action_settings.setInteractive(new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576), Phaser.Geom.Rectangle.Contains);
    game_action_settings.scaleX = 2;
    game_action_settings.scaleY = 2;
    game_actions_container.add(game_action_settings);

    // game_actions_quit_bg_1
    const game_actions_quit_bg_1 = this.add.nineslice(0, 0, "gui", "cryos_mini_gui/buttons/button_small.png", 40, 20, 3, 3, 3, 3);
    game_actions_quit_bg_1.scaleX = 2.3521289589041787;
    game_actions_quit_bg_1.scaleY = 1.5492262688240692;
    game_action_settings.add(game_actions_quit_bg_1);

    // text_2
    const text_2 = this.add.text(-1, 0, "", {});
    text_2.setOrigin(0.5, 0.5);
    text_2.text = "Settings";
    text_2.setStyle({ "align": "center", "color": "#000000ff", "fontSize": "14px" });
    game_action_settings.add(text_2);

    // onPointerUpScript_settings
    const onPointerUpScript_settings = new OnPointerUpScript(game_action_settings);

    // emitEventSettings
    const emitEventSettings = new EmitEventActionScript(onPointerUpScript_settings);

    // onPointerDownScript_settings
    const onPointerDownScript_settings = new OnPointerDownScript(game_action_settings);

    // settings_click
    new PushActionScript(onPointerDownScript_settings);

    // game_action_restart
    const game_action_restart = this.add.container(-3.6060558040172737, -81.29550515717648);
    game_action_restart.setInteractive(new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576), Phaser.Geom.Rectangle.Contains);
    game_action_restart.scaleX = 2;
    game_action_restart.scaleY = 2;
    game_actions_container.add(game_action_restart);

    // game_actions_quit_bg
    const game_actions_quit_bg = this.add.nineslice(0, 0, "gui", "cryos_mini_gui/buttons/button_small.png", 40, 20, 3, 3, 3, 3);
    game_actions_quit_bg.scaleX = 2.3521289589041787;
    game_actions_quit_bg.scaleY = 1.5492262688240692;
    game_action_restart.add(game_actions_quit_bg);

    // text
    const text = this.add.text(-1, 0, "", {});
    text.setOrigin(0.5, 0.5);
    text.text = "Restart";
    text.setStyle({ "align": "center", "color": "#000000ff", "fontSize": "14px" });
    game_action_restart.add(text);

    // onPointerUpScript_continue_1
    const onPointerUpScript_continue_1 = new OnPointerUpScript(game_action_restart);

    // emitEventRestart
    const emitEventRestart = new EmitEventActionScript(onPointerUpScript_continue_1);

    // onPointerDownScript_restart
    const onPointerDownScript_restart = new OnPointerDownScript(game_action_restart);

    // restart_click
    new PushActionScript(onPointerDownScript_restart);

    // game_action_continue
    const game_action_continue = this.add.container(-4.606055804017274, -147.29550515717648);
    game_action_continue.setInteractive(new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576), Phaser.Geom.Rectangle.Contains);
    game_action_continue.scaleX = 2;
    game_action_continue.scaleY = 2;
    game_actions_container.add(game_action_continue);

    // game_actions_quit_bg_2
    const game_actions_quit_bg_2 = this.add.nineslice(0, 0, "gui", "cryos_mini_gui/buttons/button_small.png", 40, 20, 3, 3, 3, 3);
    game_actions_quit_bg_2.scaleX = 2.3521289589041787;
    game_actions_quit_bg_2.scaleY = 1.5492262688240692;
    game_action_continue.add(game_actions_quit_bg_2);

    // text_1
    const text_1 = this.add.text(-1, 0, "", {});
    text_1.setOrigin(0.5, 0.5);
    text_1.text = "Continue";
    text_1.setStyle({ "align": "center", "color": "#000000ff", "fontSize": "14px", "stroke": "#ffffffff" });
    game_action_continue.add(text_1);

    // onPointerUpScript_continue
    const onPointerUpScript_continue = new OnPointerUpScript(game_action_continue);

    // emitEventContinueAction
    const emitEventContinueAction = new EmitEventActionScript(onPointerUpScript_continue);

    // onPointerDownScript_continue
    const onPointerDownScript_continue = new OnPointerDownScript(game_action_continue);

    // continue_click
    new PushActionScript(onPointerDownScript_continue);

    // emitEventQuit (prefab fields)
    emitEventQuit.eventName = "game-continue";

    // emitEventLoad (prefab fields)
    emitEventLoad.eventName = "game-continue";

    // emitEventSaveAction (prefab fields)
    emitEventSaveAction.eventName = "game-continue";

    // emitEventSettings (prefab fields)
    emitEventSettings.eventName = "game-continue";

    // emitEventRestart (prefab fields)
    emitEventRestart.eventName = "game-continue";

    // emitEventContinueAction (prefab fields)
    emitEventContinueAction.eventName = "game-continue";

    this.game_action_quit = game_action_quit;
    this.game_action_load = game_action_load;
    this.game_action_save = game_action_save;
    this.game_action_settings = game_action_settings;
    this.game_action_restart = game_action_restart;
    this.game_action_continue = game_action_continue;
    this.game_actions_container = game_actions_container;

    this.events.emit("scene-awake");
  }

  private game_action_quit!: Phaser.GameObjects.Container;
  private game_action_load!: Phaser.GameObjects.Container;
  private game_action_save!: Phaser.GameObjects.Container;
  private game_action_settings!: Phaser.GameObjects.Container;
  private game_action_restart!: Phaser.GameObjects.Container;
  private game_action_continue!: Phaser.GameObjects.Container;
  private game_actions_container!: Phaser.GameObjects.Container;

  /* START-USER-CODE */

  // Write your code here

  create() {
    this.editorCreate();

    // resize the scene to match the screen size
    this.scale.on("resize", this.resize, this);
    this.resize({ height: this.scale.height, width: this.scale.width });

    this.addBackgroundOverlay();
    this.handleQuit();
    this.handleContinue();
    this.handleSaveGame();
    this.handleButtonVisibility();
  }

  private handleQuit() {
    this.game_action_quit.once("game-quit", () => {
      // todo rather than this, change the player state session state to "to score screen" because only 1 player quits
      this.communicator.gameInstanceMetadataChanged?.send({
        property: "sessionState",
        gameInstanceId: this.baseGameData.gameInstance.gameInstanceMetadata.data.gameInstanceId!,
        data: { sessionState: GameSessionState.ToScoreScreen },
        emitterUserId: this.baseGameData.user.userId
      });
      this.destroySelf();
    });
  }

  private resize(gameSize: { width: number; height: number }) {
    // set game actions to center
    this.game_actions_container.setPosition(gameSize.width / 2, gameSize.height / 2);
  }

  private addBackgroundOverlay() {
    const bgOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.5);
    bgOverlay.setOrigin(0, 0);
    bgOverlay.setDepth(-1);
    bgOverlay.setInteractive();
    bgOverlay.once(
      "pointerdown",
      (_: Phaser.Input.Pointer, __: number, ___: number, event: Phaser.Types.Input.EventData) => {
        event.stopPropagation();
        this.destroySelf();
      }
    );
  }

  private handleSaveGame() {
    this.game_action_save.once("game-save", () => {
      this.communicator.allScenes.emit({ name: "save-game" });
      this.destroySelf();
    });
  }

  private handleContinue() {
    this.game_action_continue.once("game-continue", () => {
      this.destroySelf();
    });
  }

  get isVisibleSaveButton() {
    return !this.baseGameData.gameInstance.gameInstanceMetadata.isReplay();
  }

  private handleButtonVisibility() {
    this.game_action_quit.visible = this.isVisibleSaveButton;
  }

  private destroySelf() {
    this.scene.stop();
  }

  destroy() {
    super.destroy();
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
