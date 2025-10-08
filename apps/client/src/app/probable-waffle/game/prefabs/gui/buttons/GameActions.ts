// You can write more code here

/* START OF COMPILED CODE */

import OnPointerDownScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
import PushActionScript from "../../../../../shared/game/phaser/script-nodes/PushActionScript";
import OnPointerUpScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerUpScript";
import EmitEventActionScript from "../../../../../shared/game/phaser/script-nodes-basic/EmitEventActionScript";
/* START-USER-IMPORTS */
import GameActionsLayer from "../../../world/scenes/hud-scenes/GameActionsLayer";
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
      20,
      10,
      1,
      1,
      1,
      1
    );
    game_actions_bg.scaleX = 2.39000249797712;
    game_actions_bg.scaleY = 2.3713497642893233;
    game_actions_bg.setOrigin(0, 0);
    this.add(game_actions_bg);

    // game_action_menu
    const game_action_menu = scene.add.container(-28, 11);
    game_action_menu.setInteractive(
      new Phaser.Geom.Rectangle(-18, -8, 34.60550202698232, 15.018236448430386),
      Phaser.Geom.Rectangle.Contains
    );
    this.add(game_action_menu);

    // game_actions_quit_bg
    const game_actions_quit_bg = scene.add.nineslice(
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
    game_actions_quit_bg.scaleX = 0.9577274362605128;
    game_actions_quit_bg.scaleY = 0.9194089554823783;
    game_action_menu.add(game_actions_quit_bg);

    // onPointerDownScript_menu
    const onPointerDownScript_menu = new OnPointerDownScript(game_action_menu);

    // menu_click
    new PushActionScript(onPointerDownScript_menu);

    // onPointerUpScript_menu
    const onPointerUpScript_menu = new OnPointerUpScript(game_action_menu);

    // emitEventQuitAction
    const emitEventQuitAction = new EmitEventActionScript(onPointerUpScript_menu);

    // text_1
    const text_1 = scene.add.text(0, -2, "", {});
    text_1.setOrigin(0.5, 0.5);
    text_1.text = "Menu";
    text_1.setStyle({ align: "center", color: "#000000ff", fontFamily: "disposabledroid", resolution: 10 });
    game_action_menu.add(text_1);

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

  override destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.game_action_menu.off("menu-open", this.createGameActionsLayer);
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
