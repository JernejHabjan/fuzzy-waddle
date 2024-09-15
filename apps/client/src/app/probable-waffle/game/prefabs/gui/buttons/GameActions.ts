// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
import OnPointerDownScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
import PushActionScript from "../../../../../shared/game/phaser/script-nodes/PushActionScript";
import OnPointerUpScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerUpScript";
import EmitEventActionScript from "../../../../../shared/game/phaser/script-nodes-basic/EmitEventActionScript";
/* START-USER-IMPORTS */
import GameActionsLayer from "../../../scenes/GameActionsLayer";
/* END-USER-IMPORTS */

export default class GameActions extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 104, y ?? 2);

    this.scaleX = 2;
    this.scaleY = 2;

    // game_actions_bg
    const game_actions_bg = scene.add.nineslice(
      -52,
      -1,
      "gui",
      "cryos_mini_gui/surfaces/surface_dark.png",
      10,
      10,
      1,
      1,
      1,
      1
    );
    game_actions_bg.scaleX = 5.028254553915996;
    game_actions_bg.scaleY = 3.858978666894958;
    game_actions_bg.setOrigin(0, 0);
    this.add(game_actions_bg);

    // game_action_menu
    const game_action_menu = scene.add.container(-26.453369211907784, 18);
    game_action_menu.setInteractive(
      new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );
    this.add(game_action_menu);

    // game_actions_quit_bg
    const game_actions_quit_bg = scene.add.nineslice(
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
    game_action_menu.add(game_actions_quit_bg);

    // game_actions_quit_icon
    const game_actions_quit_icon = scene.add.image(0, 0, "factions", "character_icons/general/warrior.png");
    game_actions_quit_icon.scaleX = 0.31509307156922584;
    game_actions_quit_icon.scaleY = 0.31509307156922584;
    game_actions_quit_icon.setOrigin(0.5, 0.7);
    game_action_menu.add(game_actions_quit_icon);

    // onPointerDownScript_menu
    const onPointerDownScript_menu = new OnPointerDownScript(game_action_menu);

    // menu_click
    new PushActionScript(onPointerDownScript_menu);

    // onPointerUpScript_menu
    const onPointerUpScript_menu = new OnPointerUpScript(game_action_menu);

    // emitEventQuitAction
    const emitEventQuitAction = new EmitEventActionScript(onPointerUpScript_menu);

    // emitEventQuitAction (prefab fields)
    emitEventQuitAction.eventName = "menu-open";

    this.game_action_menu = game_action_menu;

    /* START-USER-CTR-CODE */
    this.subscribeToGameAction();
    /* END-USER-CTR-CODE */
  }

  private game_action_menu: Phaser.GameObjects.Container;

  /* START-USER-CODE */

  private subscribeToGameAction() {
    this.game_action_menu.on("menu-open", this.createGameActionsLayer);
  }

  private createGameActionsLayer = () => {
    const layer = this.scene.scene.get<GameActionsLayer>("GameActionsLayer") as GameActionsLayer;
    layer.scene.start();
  };

  destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.game_action_menu.off("menu-open", this.createGameActionsLayer);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
