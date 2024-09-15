// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
import ActorAction from "./ActorAction";
/* START-USER-IMPORTS */
/* END-USER-IMPORTS */

export default class ActorActions extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 256, y ?? 197);

    // actor_actions_bg
    const actor_actions_bg = scene.add.nineslice(
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
    this.add(actor_actions_bg);

    // actor_actions_border
    const actor_actions_border = scene.add.nineslice(
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
    this.add(actor_actions_border);

    // actorAction
    const actorAction = new ActorAction(scene, -205, -156);
    this.add(actorAction);

    // actorAction_1
    const actorAction_1 = new ActorAction(scene, -128, -156);
    this.add(actorAction_1);

    // actorAction_2
    const actorAction_2 = new ActorAction(scene, -51, -156);
    this.add(actorAction_2);

    // actorAction_3
    const actorAction_3 = new ActorAction(scene, -205, -98);
    this.add(actorAction_3);

    // actorAction_4
    const actorAction_4 = new ActorAction(scene, -128, -98);
    this.add(actorAction_4);

    // actorAction_5
    const actorAction_5 = new ActorAction(scene, -51, -98);
    this.add(actorAction_5);

    // actorAction_6
    const actorAction_6 = new ActorAction(scene, -205, -40);
    this.add(actorAction_6);

    // actorAction_7
    const actorAction_7 = new ActorAction(scene, -128, -40);
    this.add(actorAction_7);

    // actorAction_8
    const actorAction_8 = new ActorAction(scene, -51, -40);
    this.add(actorAction_8);

    this.actorAction = actorAction;
    this.actorAction_1 = actorAction_1;
    this.actorAction_2 = actorAction_2;
    this.actorAction_3 = actorAction_3;
    this.actorAction_4 = actorAction_4;
    this.actorAction_5 = actorAction_5;
    this.actorAction_6 = actorAction_6;
    this.actorAction_7 = actorAction_7;
    this.actorAction_8 = actorAction_8;

    /* START-USER-CTR-CODE */
    this.testSetIcons();
    /* END-USER-CTR-CODE */
  }

  private actorAction: ActorAction;
  private actorAction_1: ActorAction;
  private actorAction_2: ActorAction;
  private actorAction_3: ActorAction;
  private actorAction_4: ActorAction;
  private actorAction_5: ActorAction;
  private actorAction_6: ActorAction;
  private actorAction_7: ActorAction;
  private actorAction_8: ActorAction;

  /* START-USER-CODE */

  private testSetIcons() {
    this.actorAction.setup({
      icon: {
        key: "factions",
        frame: "character_icons/tivara/archer_female.png",
        origin: { x: 0.5, y: 0.7 }
      },
      visible: true,
      action: () => {
        console.log("Action 1");
      },
      disabled: true
    });
    this.actorAction_1.setup({
      icon: {
        key: "factions",
        frame: "character_icons/tivara/slingshot_female.png",
        origin: { x: 0.5, y: 0.7 }
      },
      visible: true,
      action: () => {
        console.log("Action 1");
      },
      tooltipInfo: {
        name: "Slingshot", // todo source this from actor definition
        description: "A ranged unit" // todo source this from actor definition
      }
    });
    this.actorAction_2.setup({
      icon: {
        key: "gui",
        frame: "action_icons/hand.png",
        origin: { x: 0.5, y: 0.7 }
      },
      visible: true,
      action: () => {
        console.log("Stop action");
      },
      tooltipInfo: {
        name: "Stop",
        description: "Stops a current command"
      }
    });
    this.actorAction_8.setup({
      visible: false
    });
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
