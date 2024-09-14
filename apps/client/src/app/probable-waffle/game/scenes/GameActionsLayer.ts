// You can write more code here

/* START OF COMPILED CODE */

import OnPointerDownScript from "../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
import PushActionScript from "../../../shared/game/phaser/script-nodes/PushActionScript";
import OnPointerUpScript from "../../../shared/game/phaser/script-nodes-basic/OnPointerUpScript";
import EmitEventActionScript from "../../../shared/game/phaser/script-nodes-basic/EmitEventActionScript";
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
    const game_actions_container = this.add.container(62, 92);

    // game_actions_bg
    const game_actions_bg = this.add.nineslice(
      -61.858652419097176,
      -92.9031124568149,
      "gui",
      "cryos_mini_gui/surfaces/surface_dark.png",
      20,
      20,
      1,
      1,
      1,
      1
    );
    game_actions_bg.scaleX = 6.062842767407767;
    game_actions_bg.scaleY = 9.857841226923552;
    game_actions_bg.setOrigin(0, 0);
    game_actions_container.add(game_actions_bg);

    // game_action_quit
    const game_action_quit = this.add.container(0, 62);
    game_action_quit.setInteractive(
      new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );
    game_action_quit.scaleX = 2;
    game_action_quit.scaleY = 2;
    game_actions_container.add(game_action_quit);

    // game_actions_quit_bg
    const game_actions_quit_bg = this.add.nineslice(
      0,
      0,
      "gui",
      "cryos_mini_gui/buttons/button_small.png",
      20,
      20,
      3,
      3,
      3,
      3
    );
    game_actions_quit_bg.scaleX = 2.0762647352357817;
    game_actions_quit_bg.scaleY = 1.5492262688240692;
    game_action_quit.add(game_actions_quit_bg);

    // game_actions_quit_icon
    const game_actions_quit_icon = this.add.image(0, 0, "factions", "character_icons/general/warrior.png");
    game_actions_quit_icon.scaleX = 0.31509307156922584;
    game_actions_quit_icon.scaleY = 0.31509307156922584;
    game_actions_quit_icon.setOrigin(0.5, 0.7);
    game_action_quit.add(game_actions_quit_icon);

    // onPointerDownScript_quit
    const onPointerDownScript_quit = new OnPointerDownScript(game_action_quit);

    // quit_click
    new PushActionScript(onPointerDownScript_quit);

    // onPointerUpScript_quit
    const onPointerUpScript_quit = new OnPointerUpScript(game_action_quit);

    // emitEventQuitAction
    const emitEventQuitAction = new EmitEventActionScript(onPointerUpScript_quit);

    // game_action_save
    const game_action_save = this.add.container(1, 5);
    game_action_save.setInteractive(
      new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );
    game_action_save.scaleX = 2;
    game_action_save.scaleY = 2;
    game_actions_container.add(game_action_save);

    // game_actions_quit_bg_1
    const game_actions_quit_bg_1 = this.add.nineslice(
      0,
      0,
      "gui",
      "cryos_mini_gui/buttons/button_small.png",
      20,
      20,
      3,
      3,
      3,
      3
    );
    game_actions_quit_bg_1.scaleX = 2.0762647352357817;
    game_actions_quit_bg_1.scaleY = 1.5492262688240692;
    game_action_save.add(game_actions_quit_bg_1);

    // game_actions_quit_icon_1
    const game_actions_quit_icon_1 = this.add.image(0, 0, "factions", "character_icons/general/warrior.png");
    game_actions_quit_icon_1.scaleX = 0.31509307156922584;
    game_actions_quit_icon_1.scaleY = 0.31509307156922584;
    game_actions_quit_icon_1.setOrigin(0.5, 0.7);
    game_action_save.add(game_actions_quit_icon_1);

    // onPointerDownScript_save
    const onPointerDownScript_save = new OnPointerDownScript(game_action_save);

    // save_click
    new PushActionScript(onPointerDownScript_save);

    // onPointerUpScript_save
    const onPointerUpScript_save = new OnPointerUpScript(game_action_save);

    // emitEventSaveAction
    const emitEventSaveAction = new EmitEventActionScript(onPointerUpScript_save);

    // game_action_continue
    const game_action_continue = this.add.container(1, -54);
    game_action_continue.setInteractive(
      new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );
    game_action_continue.scaleX = 2;
    game_action_continue.scaleY = 2;
    game_actions_container.add(game_action_continue);

    // game_actions_quit_bg_2
    const game_actions_quit_bg_2 = this.add.nineslice(
      0,
      0,
      "gui",
      "cryos_mini_gui/buttons/button_small.png",
      20,
      20,
      3,
      3,
      3,
      3
    );
    game_actions_quit_bg_2.scaleX = 2.0762647352357817;
    game_actions_quit_bg_2.scaleY = 1.5492262688240692;
    game_action_continue.add(game_actions_quit_bg_2);

    // game_actions_quit_icon_2
    const game_actions_quit_icon_2 = this.add.image(0, 0, "factions", "character_icons/general/warrior.png");
    game_actions_quit_icon_2.scaleX = 0.31509307156922584;
    game_actions_quit_icon_2.scaleY = 0.31509307156922584;
    game_actions_quit_icon_2.setOrigin(0.5, 0.7);
    game_action_continue.add(game_actions_quit_icon_2);

    // onPointerDownScript_continue
    const onPointerDownScript_continue = new OnPointerDownScript(game_action_continue);

    // continue_click
    new PushActionScript(onPointerDownScript_continue);

    // onPointerUpScript_continue
    const onPointerUpScript_continue = new OnPointerUpScript(game_action_continue);

    // emitEventContinueAction
    const emitEventContinueAction = new EmitEventActionScript(onPointerUpScript_continue);

    // emitEventQuitAction (prefab fields)
    emitEventQuitAction.eventName = "game-quit";

    // emitEventSaveAction (prefab fields)
    emitEventSaveAction.eventName = "game-save";

    // emitEventContinueAction (prefab fields)
    emitEventContinueAction.eventName = "game-continue";

    this.game_action_quit = game_action_quit;
    this.game_action_save = game_action_save;
    this.game_action_continue = game_action_continue;
    this.game_actions_container = game_actions_container;

    this.events.emit("scene-awake");
  }

  private game_action_quit!: Phaser.GameObjects.Container;
  private game_action_save!: Phaser.GameObjects.Container;
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

  initializeWithParentScene(param: ProbableWaffleScene) {}

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
