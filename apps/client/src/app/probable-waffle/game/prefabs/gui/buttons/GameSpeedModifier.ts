// You can write more code here

/* START OF COMPILED CODE */

import OnPointerUpScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerUpScript";
import EmitEventActionScript from "../../../../../shared/game/phaser/script-nodes-basic/EmitEventActionScript";
import OnPointerDownScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
import PushActionScript from "../../../../../shared/game/phaser/script-nodes/PushActionScript";
/* START-USER-IMPORTS */
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import HudProbableWaffle from "../../../scenes/HudProbableWaffle";
/* END-USER-IMPORTS */

export default class GameSpeedModifier extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 0, y ?? 0);

    // multiplier_10x
    const multiplier_10x = scene.add.container(101, 15);
    multiplier_10x.setInteractive(
      new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );
    this.add(multiplier_10x);

    // game_action_bg_2
    const game_action_bg_2 = scene.add.nineslice(
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
    game_action_bg_2.scaleX = 2.0762647352357817;
    game_action_bg_2.scaleY = 1.5492262688240692;
    multiplier_10x.add(game_action_bg_2);

    // text_2
    const text_2 = scene.add.text(0, -1, "", {});
    text_2.setOrigin(0.5, 0.5);
    text_2.text = "10x";
    text_2.setStyle({ color: "#000000ff", fontFamily: "disposabledroid", fontSize: "22px", resolution: 10 });
    multiplier_10x.add(text_2);

    // onPointerUpScript_menu_1
    const onPointerUpScript_menu_1 = new OnPointerUpScript(multiplier_10x);

    // emitActorAction_2
    const emitActorAction_2 = new EmitEventActionScript(onPointerUpScript_menu_1);

    // onPointerDownScript_2
    const onPointerDownScript_2 = new OnPointerDownScript(multiplier_10x);

    // action_click_2
    new PushActionScript(onPointerDownScript_2);

    // multiplier_3x
    const multiplier_3x = scene.add.container(61, 15);
    multiplier_3x.setInteractive(
      new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );
    this.add(multiplier_3x);

    // game_action_bg_1
    const game_action_bg_1 = scene.add.nineslice(
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
    game_action_bg_1.scaleX = 2.0762647352357817;
    game_action_bg_1.scaleY = 1.5492262688240692;
    multiplier_3x.add(game_action_bg_1);

    // text
    const text = scene.add.text(0, -1, "", {});
    text.setOrigin(0.5, 0.5);
    text.text = "3x";
    text.setStyle({ color: "#000000ff", fontFamily: "disposabledroid", fontSize: "22px", resolution: 10 });
    multiplier_3x.add(text);

    // onPointerUpScript_menu
    const onPointerUpScript_menu = new OnPointerUpScript(multiplier_3x);

    // emitActorAction_1
    const emitActorAction_1 = new EmitEventActionScript(onPointerUpScript_menu);

    // onPointerDownScript_1
    const onPointerDownScript_1 = new OnPointerDownScript(multiplier_3x);

    // action_click_1
    new PushActionScript(onPointerDownScript_1);

    // multiplier_1x
    const multiplier_1x = scene.add.container(21, 15);
    multiplier_1x.setInteractive(
      new Phaser.Geom.Rectangle(-17, -13, 34.60550202698232, 25.429332302435576),
      Phaser.Geom.Rectangle.Contains
    );
    this.add(multiplier_1x);

    // game_action_bg
    const game_action_bg = scene.add.nineslice(
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
    game_action_bg.scaleX = 2.0762647352357817;
    game_action_bg.scaleY = 1.5492262688240692;
    multiplier_1x.add(game_action_bg);

    // text_1
    const text_1 = scene.add.text(0, -1, "", {});
    text_1.setOrigin(0.5, 0.5);
    text_1.text = "1x";
    text_1.setStyle({ color: "#000000ff", fontFamily: "disposabledroid", fontSize: "22px", resolution: 10 });
    multiplier_1x.add(text_1);

    // onPointerUpScript_menu_9
    const onPointerUpScript_menu_9 = new OnPointerUpScript(multiplier_1x);

    // emitActorAction
    const emitActorAction = new EmitEventActionScript(onPointerUpScript_menu_9);

    // onPointerDownScript
    const onPointerDownScript = new OnPointerDownScript(multiplier_1x);

    // action_click
    new PushActionScript(onPointerDownScript);

    // emitActorAction_2 (prefab fields)
    emitActorAction_2.eventName = "action";

    // emitActorAction_1 (prefab fields)
    emitActorAction_1.eventName = "action";

    // emitActorAction (prefab fields)
    emitActorAction.eventName = "action";

    this.multiplier_10x = multiplier_10x;
    this.multiplier_3x = multiplier_3x;
    this.multiplier_1x = multiplier_1x;

    /* START-USER-CTR-CODE */
    this.scene.events.on(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.init();
    /* END-USER-CTR-CODE */
  }

  private multiplier_10x: Phaser.GameObjects.Container;
  private multiplier_3x: Phaser.GameObjects.Container;
  private multiplier_1x: Phaser.GameObjects.Container;

  /* START-USER-CODE */
  private mainSceneWithActors?: ProbableWaffleScene;
  private init() {
    this.mainSceneWithActors = (this.scene as HudProbableWaffle).probableWaffleScene!;
    this.multiplier_1x.on("action", () => {
      if (this.mainSceneWithActors) {
        this.mainSceneWithActors.time.timeScale = 1;
        this.mainSceneWithActors.anims.globalTimeScale = 1;
        this.mainSceneWithActors.tweens.timeScale = 1;
      }
    });

    this.multiplier_3x.on("action", () => {
      if (this.mainSceneWithActors) {
        this.mainSceneWithActors.time.timeScale = 3;
        this.mainSceneWithActors.anims.globalTimeScale = 3;
        this.mainSceneWithActors.tweens.timeScale = 3;
      }
    });

    this.multiplier_10x.on("action", () => {
      if (this.mainSceneWithActors) {
        this.mainSceneWithActors.time.timeScale = 10;
        this.mainSceneWithActors.anims.globalTimeScale = 10;
        this.mainSceneWithActors.tweens.timeScale = 10;
      }
    });
  }

  destroy() {
    super.destroy();
    this.multiplier_1x.removeAllListeners();
    this.multiplier_3x.removeAllListeners();
    this.multiplier_10x.removeAllListeners();
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
