// You can write more code here

/* START OF COMPILED CODE */

import OnPointerDownScript from "../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
import PushActionScript from "../../../shared/game/phaser/script-nodes/PushActionScript";
import OnPointerUpScript from "../../../shared/game/phaser/script-nodes-basic/OnPointerUpScript";
import EmitEventActionScript from "../../../shared/game/phaser/script-nodes-basic/EmitEventActionScript";
/* START-USER-IMPORTS */
import { ProbableWaffleScene } from "../core/probable-waffle.scene";
import { HudGameState } from "../hud/hud-game-state";
import { HudElementVisibilityHandler } from "../hud/hud-element-visibility.handler";
import { CursorHandler } from "../world/managers/controllers/input/cursor.handler";
import { MultiSelectionHandler } from "../world/managers/controllers/input/multi-selection.handler";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { getSceneComponent } from "./components/scene-component-helpers";
import { TilemapComponent } from "./components/tilemap.component";
import { getActorComponent } from "../data/actor-component";
import { getTileCoordsUnderObject } from "../library/tile-under-object";
import { OwnerComponent } from "../entity/actor/components/owner-component";
import { ObjectDescriptorComponent } from "../entity/actor/components/object-descriptor-component";
import { getGameObjectBounds } from "../data/game-object-helper";
import GameActionsLayer from "./GameActionsLayer";
import { filter, Subscription } from "rxjs";
/* END-USER-IMPORTS */

export default class HudProbableWaffle extends ProbableWaffleScene {
  constructor() {
    super("HudProbableWaffle");

    /* START-USER-CTR-CODE */
    // Write your code here.
    /* END-USER-CTR-CODE */
  }

  editorCreate(): void {
    // actor_actions_container
    const actor_actions_container = this.add.container(1280, 720);

    // actor_actions_bg
    const actor_actions_bg = this.add.nineslice(
      -128,
      -99,
      "gui",
      "cryos_mini_gui/surfaces/surface_parchment.png",
      32,
      32,
      3,
      3,
      3,
      3
    );
    actor_actions_bg.scaleX = 7.344280364470656;
    actor_actions_bg.scaleY = 5.861319993557232;
    actor_actions_container.add(actor_actions_bg);

    // actor_actions_border
    const actor_actions_border = this.add.nineslice(
      -256,
      -197,
      "gui",
      "cryos_mini_gui/borders/border_wood.png",
      92,
      92,
      4,
      4,
      4,
      4
    );
    actor_actions_border.scaleX = 2.7822944266514025;
    actor_actions_border.scaleY = 2.138649387365639;
    actor_actions_border.setOrigin(0, 0);
    actor_actions_container.add(actor_actions_border);

    // actor_action_1
    const actor_action_1 = this.add.container(-205, -158);
    actor_action_1.setInteractive(
      new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );
    actor_action_1.scaleX = 2;
    actor_action_1.scaleY = 2;
    actor_actions_container.add(actor_action_1);

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
    actor_action_1.add(game_actions_quit_bg_1);

    // game_actions_quit_icon_1
    const game_actions_quit_icon_1 = this.add.image(0, 0, "factions", "character_icons/general/warrior.png");
    game_actions_quit_icon_1.scaleX = 0.31509307156922584;
    game_actions_quit_icon_1.scaleY = 0.31509307156922584;
    game_actions_quit_icon_1.setOrigin(0.5, 0.7);
    actor_action_1.add(game_actions_quit_icon_1);

    // onPointerDownScript_menu_1
    const onPointerDownScript_menu_1 = new OnPointerDownScript(actor_action_1);

    // menu_click_1
    new PushActionScript(onPointerDownScript_menu_1);

    // onPointerUpScript_menu_1
    const onPointerUpScript_menu_1 = new OnPointerUpScript(actor_action_1);

    // emitEventQuitAction_1
    const emitEventQuitAction_1 = new EmitEventActionScript(onPointerUpScript_menu_1);

    // actor_action_2
    const actor_action_2 = this.add.container(-128, -158);
    actor_action_2.setInteractive(
      new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );
    actor_action_2.scaleX = 2;
    actor_action_2.scaleY = 2;
    actor_actions_container.add(actor_action_2);

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
    actor_action_2.add(game_actions_quit_bg_2);

    // game_actions_quit_icon_2
    const game_actions_quit_icon_2 = this.add.image(0, 0, "factions", "character_icons/general/warrior.png");
    game_actions_quit_icon_2.scaleX = 0.31509307156922584;
    game_actions_quit_icon_2.scaleY = 0.31509307156922584;
    game_actions_quit_icon_2.setOrigin(0.5, 0.7);
    actor_action_2.add(game_actions_quit_icon_2);

    // onPointerDownScript_menu_2
    const onPointerDownScript_menu_2 = new OnPointerDownScript(actor_action_2);

    // menu_click_2
    new PushActionScript(onPointerDownScript_menu_2);

    // onPointerUpScript_menu_2
    const onPointerUpScript_menu_2 = new OnPointerUpScript(actor_action_2);

    // emitEventQuitAction_2
    const emitEventQuitAction_2 = new EmitEventActionScript(onPointerUpScript_menu_2);

    // actor_action_3
    const actor_action_3 = this.add.container(-51, -158);
    actor_action_3.setInteractive(
      new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );
    actor_action_3.scaleX = 2;
    actor_action_3.scaleY = 2;
    actor_actions_container.add(actor_action_3);

    // game_actions_quit_bg_3
    const game_actions_quit_bg_3 = this.add.nineslice(
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
    game_actions_quit_bg_3.scaleX = 2.0762647352357817;
    game_actions_quit_bg_3.scaleY = 1.5492262688240692;
    actor_action_3.add(game_actions_quit_bg_3);

    // game_actions_quit_icon_3
    const game_actions_quit_icon_3 = this.add.image(0, 0, "factions", "character_icons/general/warrior.png");
    game_actions_quit_icon_3.scaleX = 0.31509307156922584;
    game_actions_quit_icon_3.scaleY = 0.31509307156922584;
    game_actions_quit_icon_3.setOrigin(0.5, 0.7);
    actor_action_3.add(game_actions_quit_icon_3);

    // onPointerDownScript_menu_3
    const onPointerDownScript_menu_3 = new OnPointerDownScript(actor_action_3);

    // menu_click_3
    new PushActionScript(onPointerDownScript_menu_3);

    // onPointerUpScript_menu_3
    const onPointerUpScript_menu_3 = new OnPointerUpScript(actor_action_3);

    // emitEventQuitAction_3
    const emitEventQuitAction_3 = new EmitEventActionScript(onPointerUpScript_menu_3);

    // actor_action_4
    const actor_action_4 = this.add.container(-205, -100);
    actor_action_4.setInteractive(
      new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );
    actor_action_4.scaleX = 2;
    actor_action_4.scaleY = 2;
    actor_actions_container.add(actor_action_4);

    // game_actions_quit_bg_4
    const game_actions_quit_bg_4 = this.add.nineslice(
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
    game_actions_quit_bg_4.scaleX = 2.0762647352357817;
    game_actions_quit_bg_4.scaleY = 1.5492262688240692;
    actor_action_4.add(game_actions_quit_bg_4);

    // game_actions_quit_icon_4
    const game_actions_quit_icon_4 = this.add.image(0, 0, "factions", "character_icons/general/warrior.png");
    game_actions_quit_icon_4.scaleX = 0.31509307156922584;
    game_actions_quit_icon_4.scaleY = 0.31509307156922584;
    game_actions_quit_icon_4.setOrigin(0.5, 0.7);
    actor_action_4.add(game_actions_quit_icon_4);

    // onPointerDownScript_menu_4
    const onPointerDownScript_menu_4 = new OnPointerDownScript(actor_action_4);

    // menu_click_4
    new PushActionScript(onPointerDownScript_menu_4);

    // onPointerUpScript_menu_4
    const onPointerUpScript_menu_4 = new OnPointerUpScript(actor_action_4);

    // emitEventQuitAction_4
    const emitEventQuitAction_4 = new EmitEventActionScript(onPointerUpScript_menu_4);

    // actor_action_5
    const actor_action_5 = this.add.container(-128, -101);
    actor_action_5.setInteractive(
      new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );
    actor_action_5.scaleX = 2;
    actor_action_5.scaleY = 2;
    actor_actions_container.add(actor_action_5);

    // game_actions_quit_bg_5
    const game_actions_quit_bg_5 = this.add.nineslice(
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
    game_actions_quit_bg_5.scaleX = 2.0762647352357817;
    game_actions_quit_bg_5.scaleY = 1.5492262688240692;
    actor_action_5.add(game_actions_quit_bg_5);

    // game_actions_quit_icon_5
    const game_actions_quit_icon_5 = this.add.image(0, 0, "factions", "character_icons/general/warrior.png");
    game_actions_quit_icon_5.scaleX = 0.31509307156922584;
    game_actions_quit_icon_5.scaleY = 0.31509307156922584;
    game_actions_quit_icon_5.setOrigin(0.5, 0.7);
    actor_action_5.add(game_actions_quit_icon_5);

    // onPointerDownScript_menu_5
    const onPointerDownScript_menu_5 = new OnPointerDownScript(actor_action_5);

    // menu_click_5
    new PushActionScript(onPointerDownScript_menu_5);

    // onPointerUpScript_menu_5
    const onPointerUpScript_menu_5 = new OnPointerUpScript(actor_action_5);

    // emitEventQuitAction_5
    const emitEventQuitAction_5 = new EmitEventActionScript(onPointerUpScript_menu_5);

    // actor_action_6
    const actor_action_6 = this.add.container(-51, -101);
    actor_action_6.setInteractive(
      new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );
    actor_action_6.scaleX = 2;
    actor_action_6.scaleY = 2;
    actor_actions_container.add(actor_action_6);

    // game_actions_quit_bg_6
    const game_actions_quit_bg_6 = this.add.nineslice(
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
    game_actions_quit_bg_6.scaleX = 2.0762647352357817;
    game_actions_quit_bg_6.scaleY = 1.5492262688240692;
    actor_action_6.add(game_actions_quit_bg_6);

    // game_actions_quit_icon_6
    const game_actions_quit_icon_6 = this.add.image(0, 0, "factions", "character_icons/general/warrior.png");
    game_actions_quit_icon_6.scaleX = 0.31509307156922584;
    game_actions_quit_icon_6.scaleY = 0.31509307156922584;
    game_actions_quit_icon_6.setOrigin(0.5, 0.7);
    actor_action_6.add(game_actions_quit_icon_6);

    // onPointerDownScript_menu_6
    const onPointerDownScript_menu_6 = new OnPointerDownScript(actor_action_6);

    // menu_click_6
    new PushActionScript(onPointerDownScript_menu_6);

    // onPointerUpScript_menu_6
    const onPointerUpScript_menu_6 = new OnPointerUpScript(actor_action_6);

    // emitEventQuitAction_6
    const emitEventQuitAction_6 = new EmitEventActionScript(onPointerUpScript_menu_6);

    // actor_action_7
    const actor_action_7 = this.add.container(-205, -43);
    actor_action_7.setInteractive(
      new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );
    actor_action_7.scaleX = 2;
    actor_action_7.scaleY = 2;
    actor_actions_container.add(actor_action_7);

    // game_actions_quit_bg_7
    const game_actions_quit_bg_7 = this.add.nineslice(
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
    game_actions_quit_bg_7.scaleX = 2.0762647352357817;
    game_actions_quit_bg_7.scaleY = 1.5492262688240692;
    actor_action_7.add(game_actions_quit_bg_7);

    // game_actions_quit_icon_7
    const game_actions_quit_icon_7 = this.add.image(0, 0, "factions", "character_icons/general/warrior.png");
    game_actions_quit_icon_7.scaleX = 0.31509307156922584;
    game_actions_quit_icon_7.scaleY = 0.31509307156922584;
    game_actions_quit_icon_7.setOrigin(0.5, 0.7);
    actor_action_7.add(game_actions_quit_icon_7);

    // onPointerDownScript_menu_7
    const onPointerDownScript_menu_7 = new OnPointerDownScript(actor_action_7);

    // menu_click_7
    new PushActionScript(onPointerDownScript_menu_7);

    // onPointerUpScript_menu_7
    const onPointerUpScript_menu_7 = new OnPointerUpScript(actor_action_7);

    // emitEventQuitAction_7
    const emitEventQuitAction_7 = new EmitEventActionScript(onPointerUpScript_menu_7);

    // actor_action_8
    const actor_action_8 = this.add.container(-128, -43);
    actor_action_8.setInteractive(
      new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );
    actor_action_8.scaleX = 2;
    actor_action_8.scaleY = 2;
    actor_actions_container.add(actor_action_8);

    // game_actions_quit_bg_8
    const game_actions_quit_bg_8 = this.add.nineslice(
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
    game_actions_quit_bg_8.scaleX = 2.0762647352357817;
    game_actions_quit_bg_8.scaleY = 1.5492262688240692;
    actor_action_8.add(game_actions_quit_bg_8);

    // game_actions_quit_icon_8
    const game_actions_quit_icon_8 = this.add.image(0, 0, "factions", "character_icons/general/warrior.png");
    game_actions_quit_icon_8.scaleX = 0.31509307156922584;
    game_actions_quit_icon_8.scaleY = 0.31509307156922584;
    game_actions_quit_icon_8.setOrigin(0.5, 0.7);
    actor_action_8.add(game_actions_quit_icon_8);

    // onPointerDownScript_menu_8
    const onPointerDownScript_menu_8 = new OnPointerDownScript(actor_action_8);

    // menu_click_8
    new PushActionScript(onPointerDownScript_menu_8);

    // onPointerUpScript_menu_8
    const onPointerUpScript_menu_8 = new OnPointerUpScript(actor_action_8);

    // emitEventQuitAction_8
    const emitEventQuitAction_8 = new EmitEventActionScript(onPointerUpScript_menu_8);

    // actor_action_9
    const actor_action_9 = this.add.container(-51, -42);
    actor_action_9.setInteractive(
      new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );
    actor_action_9.scaleX = 2;
    actor_action_9.scaleY = 2;
    actor_actions_container.add(actor_action_9);

    // game_actions_quit_bg_9
    const game_actions_quit_bg_9 = this.add.nineslice(
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
    game_actions_quit_bg_9.scaleX = 2.0762647352357817;
    game_actions_quit_bg_9.scaleY = 1.5492262688240692;
    actor_action_9.add(game_actions_quit_bg_9);

    // game_actions_quit_icon_9
    const game_actions_quit_icon_9 = this.add.image(0, 0, "factions", "character_icons/general/warrior.png");
    game_actions_quit_icon_9.scaleX = 0.31509307156922584;
    game_actions_quit_icon_9.scaleY = 0.31509307156922584;
    game_actions_quit_icon_9.setOrigin(0.5, 0.7);
    actor_action_9.add(game_actions_quit_icon_9);

    // onPointerDownScript_menu_9
    const onPointerDownScript_menu_9 = new OnPointerDownScript(actor_action_9);

    // menu_click_9
    new PushActionScript(onPointerDownScript_menu_9);

    // onPointerUpScript_menu_9
    const onPointerUpScript_menu_9 = new OnPointerUpScript(actor_action_9);

    // emitEventQuitAction_9
    const emitEventQuitAction_9 = new EmitEventActionScript(onPointerUpScript_menu_9);

    // actor_info_container
    const actor_info_container = this.add.container(1024, 720);
    actor_info_container.scaleX = 2.046615132804262;
    actor_info_container.scaleY = -2.2016637475156924;

    // actor_info_bg
    const actor_info_bg = this.add.nineslice(
      -214.7589702691498,
      -0.0028799829059096282,
      "gui",
      "cryos_mini_gui/surfaces/surface_parchment.png",
      32,
      16,
      3,
      3,
      3,
      3
    );
    actor_info_bg.scaleX = 6.711135518221706;
    actor_info_bg.scaleY = 5.076854073573915;
    actor_info_bg.setOrigin(0, 0);
    actor_info_container.add(actor_info_bg);

    // minimap_container
    const minimap_container = this.add.container(0, 720);
    minimap_container.scaleX = 1.0265358293529236;
    minimap_container.scaleY = 0.9537232846001076;

    // minimap_bg
    const minimap_bg = this.add.nineslice(
      13,
      -243.1329473309309,
      "gui",
      "cryos_mini_gui/surfaces/surface_parchment.png",
      32,
      32,
      3,
      3,
      3,
      3
    );
    minimap_bg.scaleX = 12.692302266339293;
    minimap_bg.scaleY = 7.211497012087156;
    minimap_bg.setOrigin(0, 0);
    minimap_container.add(minimap_bg);

    // minimap_border
    const minimap_border = this.add.nineslice(
      0,
      -255.17628729694155,
      "gui",
      "cryos_mini_gui/borders/border_wood.png",
      128,
      92,
      4,
      4,
      4,
      4
    );
    minimap_border.scaleX = 3.367102972114097;
    minimap_border.scaleY = 2.7741914555176357;
    minimap_border.setOrigin(0, 0);
    minimap_container.add(minimap_border);

    // game_actions_container
    const game_actions_container = this.add.container(1276, 4);
    game_actions_container.scaleX = 2;
    game_actions_container.scaleY = 2;

    // game_actions_bg
    const game_actions_bg = this.add.nineslice(
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
    game_actions_container.add(game_actions_bg);

    // game_action_menu
    const game_action_menu = this.add.container(-26.453369211907784, 18);
    game_action_menu.setInteractive(
      new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );
    game_actions_container.add(game_action_menu);

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
    game_action_menu.add(game_actions_quit_bg);

    // game_actions_quit_icon
    const game_actions_quit_icon = this.add.image(0, 0, "factions", "character_icons/general/warrior.png");
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

    // resources_container
    const resources_container = this.add.container(46, 3);
    resources_container.scaleX = 2;
    resources_container.scaleY = 2;

    // resources_bg
    const resources_bg = this.add.nineslice(
      0,
      0,
      "gui",
      "cryos_mini_gui/surfaces/surface_dark.png",
      40,
      10,
      1,
      1,
      1,
      1
    );
    resources_bg.scaleX = 5.410556416757487;
    resources_bg.scaleY = 3.4298532548462535;
    resources_bg.setOrigin(0, 0);
    resources_container.add(resources_bg);

    // lists
    const hudElements: Array<any> = [];

    // emitEventQuitAction_1 (prefab fields)
    emitEventQuitAction_1.eventName = "actor-action";

    // emitEventQuitAction_2 (prefab fields)
    emitEventQuitAction_2.eventName = "actor-action";

    // emitEventQuitAction_3 (prefab fields)
    emitEventQuitAction_3.eventName = "actor-action";

    // emitEventQuitAction_4 (prefab fields)
    emitEventQuitAction_4.eventName = "actor-action";

    // emitEventQuitAction_5 (prefab fields)
    emitEventQuitAction_5.eventName = "actor-action";

    // emitEventQuitAction_6 (prefab fields)
    emitEventQuitAction_6.eventName = "actor-action";

    // emitEventQuitAction_7 (prefab fields)
    emitEventQuitAction_7.eventName = "actor-action";

    // emitEventQuitAction_8 (prefab fields)
    emitEventQuitAction_8.eventName = "actor-action";

    // emitEventQuitAction_9 (prefab fields)
    emitEventQuitAction_9.eventName = "actor-action";

    // emitEventQuitAction (prefab fields)
    emitEventQuitAction.eventName = "menu-open";

    this.actor_action_1 = actor_action_1;
    this.actor_action_2 = actor_action_2;
    this.actor_action_3 = actor_action_3;
    this.actor_action_4 = actor_action_4;
    this.actor_action_5 = actor_action_5;
    this.actor_action_6 = actor_action_6;
    this.actor_action_7 = actor_action_7;
    this.actor_action_8 = actor_action_8;
    this.actor_action_9 = actor_action_9;
    this.actor_actions_container = actor_actions_container;
    this.actor_info_container = actor_info_container;
    this.minimap_container = minimap_container;
    this.game_action_menu = game_action_menu;
    this.game_actions_container = game_actions_container;
    this.resources_container = resources_container;
    this.hudElements = hudElements;

    this.events.emit("scene-awake");
  }

  private actor_action_1!: Phaser.GameObjects.Container;
  private actor_action_2!: Phaser.GameObjects.Container;
  private actor_action_3!: Phaser.GameObjects.Container;
  private actor_action_4!: Phaser.GameObjects.Container;
  private actor_action_5!: Phaser.GameObjects.Container;
  private actor_action_6!: Phaser.GameObjects.Container;
  private actor_action_7!: Phaser.GameObjects.Container;
  private actor_action_8!: Phaser.GameObjects.Container;
  private actor_action_9!: Phaser.GameObjects.Container;
  private actor_actions_container!: Phaser.GameObjects.Container;
  private actor_info_container!: Phaser.GameObjects.Container;
  private minimap_container!: Phaser.GameObjects.Container;
  private game_action_menu!: Phaser.GameObjects.Container;
  private game_actions_container!: Phaser.GameObjects.Container;
  private resources_container!: Phaser.GameObjects.Container;
  private hudElements!: Array<any>;

  /* START-USER-CODE */
  private saveGameSubscription?: Subscription;
  private minimapDiamonds: Phaser.GameObjects.Polygon[] = [];
  private actorDiamonds: Phaser.GameObjects.Polygon[] = [];
  private readonly minimapWidth = 400;
  private readonly smallMinimapWidth = 200;
  private readonly minimapBreakpoint = 800;
  private readonly minimapMargin = 20;
  private parentScene?: ProbableWaffleScene;
  private readonly isometricMinimapDepth = 1000;
  preload() {
    this.load.pack("asset-pack-gui", "assets/probable-waffle/asset-packers/asset-pack-probable-waffle-gui.json");
  }

  create() {
    this.editorCreate();

    // resize the scene to match the screen size
    this.scale.on("resize", this.resize, this);
    this.resize({ height: this.scale.height, width: this.scale.width });

    new CursorHandler(this);
    new HudGameState(this);
    new HudElementVisibilityHandler(this, this.hudElements);
    new MultiSelectionHandler(this);
    this.subscribeToGameAction();
    this.subscribeToActorActionsEvents();
    this.handleActorActionButtonVisibility();
  }

  initializeWithParentScene(parentScene: ProbableWaffleScene) {
    this.parentScene = parentScene;
    this.parentScene.onPostCreate.subscribe(this.postSceneCreate);
    this.subscribeToSaveGameEvent();
  }

  private postSceneCreate = () => {
    this.redrawMinimap();
  };

  private redrawMinimap() {
    if (!this.parentScene) return;
    const tileMapComponent = getSceneComponent(this.parentScene, TilemapComponent);
    if (!tileMapComponent) throw new Error("Tilemap component not found on parent scene");
    const width = tileMapComponent.tilemap.width;
    const sceneWidth = this.scale.width;
    const widthInPixels = sceneWidth > this.minimapBreakpoint ? this.minimapWidth : this.smallMinimapWidth;
    const y = this.scale.height - widthInPixels / 2;
    const data = tileMapComponent.data;
    this.createIsometricMinimap(widthInPixels, width, this.minimapMargin, y - this.minimapMargin, data);
    this.fillMinimapWithActors(widthInPixels, width, this.minimapMargin, y - this.minimapMargin); // todo? subscribe to actor added/removed/moved
  }

  private createDiamondShape(
    x: number,
    y: number,
    isoX: number,
    isoY: number,
    pixelWidth: number,
    pixelHeight: number,
    color: Phaser.Display.Color
  ): Phaser.GameObjects.Polygon {
    const diamondPoints = [
      { x: isoX, y: isoY + pixelHeight / 2 },
      { x: isoX + pixelWidth / 2, y: isoY },
      { x: isoX + pixelWidth, y: isoY + pixelHeight / 2 },
      { x: isoX + pixelWidth / 2, y: isoY + pixelHeight }
    ];
    const diamond = this.add.polygon(x + pixelWidth / 2, y + pixelHeight / 2, diamondPoints, color.color);
    diamond.setInteractive(new Phaser.Geom.Polygon(diamondPoints), Phaser.Geom.Polygon.Contains);
    diamond.depth = this.isometricMinimapDepth;
    return diamond;
  }

  private createIsometricMinimap(
    widthInPixels: number,
    widthInTiles: number,
    x: number,
    y: number,
    layerData: Phaser.Tilemaps.Tile[][]
  ) {
    const height = widthInPixels / 2;
    const pixelWidth = widthInPixels / widthInTiles;
    const pixelHeight = height / widthInTiles;
    const centerX = widthInPixels / 2;
    const offsetX = centerX - pixelWidth / 2;

    this.minimapDiamonds.forEach((diamond) => diamond.destroy());
    this.minimapDiamonds = [];
    for (let i = 0; i < widthInTiles; i++) {
      for (let j = 0; j < widthInTiles; j++) {
        const tile = layerData[i][j];
        const color = this.getColorFromTiledProperty(tile) ?? Phaser.Display.Color.RandomRGB();
        const isoX = offsetX + (j - i) * (pixelWidth / 2);
        const isoY = (i + j) * (pixelHeight / 2);
        const diamond = this.createDiamondShape(x, y, isoX, isoY, pixelWidth, pixelHeight, color);
        diamond.on("pointerover", (pointer: Phaser.Input.Pointer) => {
          if (pointer.rightButtonDown()) {
            this.assignActorActionToTileCoordinates({ x: i, y: j });
            // Handle right-click logic here
          } else if (pointer.leftButtonDown()) {
            this.moveCameraToTileCoordinates({ x: i, y: j });
          }
        });
        this.minimapDiamonds.push(diamond);
      }
    }
  }

  private getIsometricCoordinates(tileXY: Vector2Simple): { isoX: number; isoY: number } | null {
    const { x, y } = tileXY;

    if (!this.parentScene) throw new Error("Parent scene not set");
    const tileMapComponent = getSceneComponent(this.parentScene, TilemapComponent);
    if (!tileMapComponent) throw new Error("Tilemap component not found on parent scene");

    const tile = tileMapComponent.tilemap.getTileAt(x, y);
    if (!tile) return null;

    const isoX = (y - x) * (tile.width / 2);
    const isoY = (x + y) * (tile.height / 2);

    return { isoX, isoY };
  }

  private moveCameraToTileCoordinates(tileXY: Vector2Simple) {
    if (!this.parentScene) throw new Error("Parent scene not set");
    const isoCoords = this.getIsometricCoordinates(tileXY);
    if (!isoCoords) return;

    const { isoX, isoY } = isoCoords;
    this.parentScene.cameras.main.pan(isoX, isoY, 50, Phaser.Math.Easing.Quadratic.InOut);
  }

  private assignActorActionToTileCoordinates(tileXY: Vector2Simple) {
    if (!this.parentScene) throw new Error("Parent scene not set");
    const isoCoords = this.getIsometricCoordinates(tileXY);
    if (!isoCoords) return;

    const { isoX, isoY } = isoCoords;
    console.log("Assigning action to tile coordinates", isoX, isoY);
    this.parentScene.events.emit("assignActorActionToTileCoordinates", { x: isoX, y: isoY }); // todo
  }

  private fillMinimapWithActors(widthInPixels: number, widthInTiles: number, x: number, y: number) {
    if (!this.parentScene) throw new Error("Parent scene not set");
    const tileMapComponent = getSceneComponent(this.parentScene, TilemapComponent);
    if (!tileMapComponent) throw new Error("Tilemap component not found on parent scene");

    const height = widthInPixels / 2;
    const pixelWidth = widthInPixels / widthInTiles;
    const pixelHeight = height / widthInTiles;
    const centerX = widthInPixels / 2;
    const offsetX = centerX - pixelWidth / 2;

    this.actorDiamonds.forEach((diamond) => diamond.destroy());
    this.actorDiamonds = [];
    this.parentScene.scene.scene.children.each((child) => {
      const objectDescriptor = getActorComponent(child, ObjectDescriptorComponent);
      if (!objectDescriptor) return;

      // const colliderComponent = getActorComponent(child, ColliderComponent);
      // if (!colliderComponent) return;

      const tilesUnderObject: Vector2Simple[] = getTileCoordsUnderObject(tileMapComponent.tilemap, child);
      const ownerColor = getActorComponent(child, OwnerComponent)?.ownerColor;
      // example of default color is 13025801 which is 0xc6c209
      const defaultColor = objectDescriptor.objectDescriptorDefinition?.color;

      const black = new Phaser.Display.Color(0, 0, 0);
      const fallbackColor =
        defaultColor === null ? null : defaultColor ? Phaser.Display.Color.IntegerToColor(defaultColor) : black;
      const color = ownerColor ?? fallbackColor;

      if (color) {
        for (const tile of tilesUnderObject) {
          const isoX = offsetX + (tile.x - tile.y) * (pixelWidth / 2);
          const isoY = (tile.x + tile.y) * (pixelHeight / 2);
          const diamond = this.createDiamondShape(x, y, isoX, isoY, pixelWidth, pixelHeight, color);
          this.actorDiamonds.push(diamond);
        }
      }
    });
  }

  private getColorFromTiledProperty(tile: Phaser.Tilemaps.Tile): Phaser.Display.Color | null {
    const color = tile.properties["color"];
    if (color) {
      // removes leading "#" and "ff"
      return Phaser.Display.Color.HexStringToColor(color.substring(3));
    }
    return null;
  }

  private resize(gameSize: { height: number; width: number }) {
    this.cameras.resize(gameSize.width, gameSize.height);
    this.updatePositionOfUiElements();
  }

  private updatePositionOfUiElements() {
    // set resources top left
    this.resources_container.x = 10;
    this.resources_container.y = 10;

    // set game actions to top right
    this.game_actions_container.x = this.scale.width - 10;
    this.game_actions_container.y = 10;

    // set minimap to bottom left
    this.minimap_container.x = 0;
    this.minimap_container.y = this.scale.height;

    // set actor actions to bottom right
    this.actor_actions_container.x = this.scale.width;
    this.actor_actions_container.y = this.scale.height;

    // set actor info to bottom center (just left of actor actions)
    const actorActionsWidth = getGameObjectBounds(this.actor_actions_container)!.width;
    this.actor_info_container.x = this.scale.width - actorActionsWidth;
    this.actor_info_container.y = this.scale.height;

    // redraw minimap
    this.redrawMinimap();
  }

  private subscribeToActorActionsEvents() {
    this.actor_action_1.on("actor-action", this.actorActionClicked.bind(this, 1));
    this.actor_action_2.on("actor-action", this.actorActionClicked.bind(this, 2));
    this.actor_action_3.on("actor-action", this.actorActionClicked.bind(this, 3));
    this.actor_action_4.on("actor-action", this.actorActionClicked.bind(this, 4));
    this.actor_action_5.on("actor-action", this.actorActionClicked.bind(this, 5));
    this.actor_action_6.on("actor-action", this.actorActionClicked.bind(this, 6));
    this.actor_action_7.on("actor-action", this.actorActionClicked.bind(this, 7));
    this.actor_action_8.on("actor-action", this.actorActionClicked.bind(this, 8));
    this.actor_action_9.on("actor-action", this.actorActionClicked.bind(this, 9));
  }

  private actorActionClicked = (action_button: number) => {
    console.log("Actor action clicked", action_button);
  };

  private subscribeToGameAction() {
    this.game_action_menu.on("menu-open", this.createGameActionsLayer);
  }

  private createGameActionsLayer = () => {
    const layer = this.scene.get<GameActionsLayer>("GameActionsLayer") as GameActionsLayer;
    layer.scene.start();
    layer.initializeWithParentScene(this.parentScene!);
  };

  private subscribeToSaveGameEvent() {
    if (!this.parentScene) return;

    this.saveGameSubscription = this.parentScene.communicator.allScenes
      .pipe(filter((value) => value.name === "save-game"))
      .subscribe(() => {
        const text = this.add.text(this.scale.width / 2, this.scale.height / 2, "Game saved", {
          fontSize: "32px",
          color: "#ffffff",
          backgroundColor: "#000000",
          padding: { x: 20, y: 10 }
        });
        text.setOrigin(0.5);
        this.time.delayedCall(500, () => text.destroy());
      });
  }

  private handleActorActionButtonVisibility() {
    this.actor_action_1.visible = true;
    this.actor_action_2.visible = true;
    this.actor_action_3.visible = true;
    this.actor_action_4.visible = true;
    this.actor_action_5.visible = true;
    this.actor_action_6.visible = true;
    this.actor_action_7.visible = true; // todo for test
    this.actor_action_8.visible = false; // todo for test
    this.actor_action_9.visible = false; // todo for test
  }

  destroy() {
    this.game_action_menu.off("menu-open", this.createGameActionsLayer);
    this.saveGameSubscription?.unsubscribe();
    // unsubscribe from actor actions
    this.actor_action_1.off("actor-action");
    this.actor_action_2.off("actor-action");
    this.actor_action_3.off("actor-action");
    this.actor_action_4.off("actor-action");
    this.actor_action_5.off("actor-action");
    this.actor_action_6.off("actor-action");
    this.actor_action_7.off("actor-action");
    this.actor_action_8.off("actor-action");
    this.actor_action_9.off("actor-action");
    super.destroy();
  }
  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
