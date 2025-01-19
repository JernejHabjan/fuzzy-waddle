// You can write more code here

/* START OF COMPILED CODE */

import ActorAction, { ActorActionSetup } from "./ActorAction";
/* START-USER-IMPORTS */
import { getSelectedActors, listenToSelectionEvents, sortActorsByPriority } from "../../../data/scene-data";
import HudProbableWaffle from "../../../scenes/HudProbableWaffle";
import { Subscription } from "rxjs";
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { AttackComponent } from "../../../entity/combat/components/attack-component";
import {
  AssignProductionErrorCode,
  ProductionComponent
} from "../../../entity/building/production/production-component";
import { ActorTranslateComponent } from "../../../entity/actor/components/actor-translate-component";
import { pwActorDefinitions } from "../../../data/actor-definitions";
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

    // actor_action_9
    const actor_action_9 = new ActorAction(scene, -51, -40);
    actor_action_9.name = "actor_action_9";
    actor_action_9.scaleX = 2;
    actor_action_9.scaleY = 2;
    this.add(actor_action_9);

    // actor_action_8
    const actor_action_8 = new ActorAction(scene, -128, -40);
    actor_action_8.name = "actor_action_8";
    actor_action_8.scaleX = 2;
    actor_action_8.scaleY = 2;
    this.add(actor_action_8);

    // actor_action_7
    const actor_action_7 = new ActorAction(scene, -205, -40);
    actor_action_7.name = "actor_action_7";
    actor_action_7.scaleX = 2;
    actor_action_7.scaleY = 2;
    this.add(actor_action_7);

    // actor_action_6
    const actor_action_6 = new ActorAction(scene, -51, -98);
    actor_action_6.name = "actor_action_6";
    actor_action_6.scaleX = 2;
    actor_action_6.scaleY = 2;
    this.add(actor_action_6);

    // actor_action_5
    const actor_action_5 = new ActorAction(scene, -128, -98);
    actor_action_5.name = "actor_action_5";
    actor_action_5.scaleX = 2;
    actor_action_5.scaleY = 2;
    this.add(actor_action_5);

    // actor_action_4
    const actor_action_4 = new ActorAction(scene, -205, -98);
    actor_action_4.name = "actor_action_4";
    actor_action_4.scaleX = 2;
    actor_action_4.scaleY = 2;
    this.add(actor_action_4);

    // actor_action_3
    const actor_action_3 = new ActorAction(scene, -51, -156);
    actor_action_3.name = "actor_action_3";
    actor_action_3.scaleX = 2;
    actor_action_3.scaleY = 2;
    this.add(actor_action_3);

    // actor_action_2
    const actor_action_2 = new ActorAction(scene, -128, -156);
    actor_action_2.name = "actor_action_2";
    actor_action_2.scaleX = 2;
    actor_action_2.scaleY = 2;
    this.add(actor_action_2);

    // actor_action_1
    const actor_action_1 = new ActorAction(scene, -205, -156);
    actor_action_1.name = "actor_action_1";
    actor_action_1.scaleX = 2;
    actor_action_1.scaleY = 2;
    this.add(actor_action_1);

    // lists
    const actor_actions = [
      actor_action_1,
      actor_action_2,
      actor_action_3,
      actor_action_4,
      actor_action_5,
      actor_action_6,
      actor_action_7,
      actor_action_8,
      actor_action_9
    ];

    this.actor_actions = actor_actions;

    /* START-USER-CTR-CODE */
    this.mainSceneWithActors = (scene as HudProbableWaffle).parentScene!;
    this.subscribeToPlayerSelection();
    this.hideAllActions();
    /* END-USER-CTR-CODE */
  }

  private actor_actions: ActorAction[];

  /* START-USER-CODE */
  private selectionChangedSubscription?: Subscription;
  private mainSceneWithActors: ProbableWaffleScene;
  private subscribeToPlayerSelection() {
    this.selectionChangedSubscription = listenToSelectionEvents(this.scene)?.subscribe(() => {
      const selectedActors = getSelectedActors(this.mainSceneWithActors);
      if (selectedActors.length === 0) {
        this.hideAllActions();
        return;
      } else {
        const actorsByPriority = sortActorsByPriority(selectedActors);
        const actor = actorsByPriority[0];
        this.showActorActions(actor);
      }
    });
  }

  private hideAllActions() {
    this.actor_actions.forEach((action) => {
      action.setup({ visible: false });
    });
  }

  private readonly attackAction = {
    icon: {
      key: "gui",
      frame: "actor_info_icons/sword.png",
      origin: { x: 0.5, y: 0.5 }
    },
    visible: true,
    action: () => {
      console.log("Attack");
    },
    tooltipInfo: {
      title: "Attack",
      description: "Attack an enemy",
      iconKey: "gui",
      iconFrame: "actor_info_icons/sword.png"
    }
  } satisfies ActorActionSetup;

  private readonly stopAction = {
    icon: {
      key: "gui",
      frame: "action_icons/hand.png",
      origin: { x: 0.5, y: 0.5 }
    },
    visible: true,
    action: () => {
      console.log("Stop");
    },
    tooltipInfo: {
      title: "Stop",
      description: "Stop current action",
      iconKey: "gui",
      iconFrame: "action_icons/hand.png"
    }
  } satisfies ActorActionSetup;

  private readonly moveAction = {
    icon: {
      key: "gui",
      frame: "action_icons/arrow.png",
      origin: { x: 0.5, y: 0.5 }
    },
    visible: true,
    action: () => {
      console.log("Move");
    },
    tooltipInfo: {
      title: "Move",
      description: "Move to a location",
      iconKey: "gui",
      iconFrame: "action_icons/arrow.png"
    }
  } satisfies ActorActionSetup;

  private showActorActions(actor: Phaser.GameObjects.GameObject) {
    let index = 0;
    const attackComponent = getActorComponent(actor, AttackComponent);
    if (attackComponent) {
      this.actor_actions[index].setup(this.attackAction);
      index++;
    }

    const actorTranslateComponent = getActorComponent(actor, ActorTranslateComponent);
    if (actorTranslateComponent) {
      this.actor_actions[index].setup(this.moveAction);
      index++;
      this.actor_actions[index].setup(this.stopAction);
      index++;
    }

    const productionComponent = getActorComponent(actor, ProductionComponent);
    if (productionComponent) {
      const availableToProduce = productionComponent.productionDefinition.availableProduceActors;
      availableToProduce.forEach((product) => {
        const actorDefinition = pwActorDefinitions[product];
        const info = actorDefinition.components?.info;
        if (!info || !info.smallImage) {
          throw new Error(`Info component not found for ${product}`);
        }
        this.actor_actions[index].setup({
          icon: {
            key: info.smallImage.key!,
            frame: info.smallImage.frame,
            origin: info.smallImage.origin
          },
          disabled: false, // todo
          visible: true,
          action: () => {
            if (!actorDefinition.components?.productionCost) {
              throw new Error(`Production cost not found for ${product}`);
            }
            const errorCode = productionComponent.startProduction({
              actorName: product,
              costData: actorDefinition.components.productionCost
            });
            switch (errorCode) {
              case AssignProductionErrorCode.NotEnoughResources:
                // play "not enough resources" sound effect - todo
                this.mainSceneWithActors.sound.playAudioSprite("character", "death");
                break;
              case AssignProductionErrorCode.QueueFull:
                // play "not enough resources" sound effect - todo
                this.mainSceneWithActors.sound.playAudioSprite("character", "death");
                break;
              case AssignProductionErrorCode.InvalidProduct:
                // should not really happen
                break;
              case AssignProductionErrorCode.NoOwner:
                // should not really happen
                break;
            }
          },
          tooltipInfo: {
            title: info.name,
            iconKey: info.smallImage.key!,
            iconFrame: info.smallImage.frame,
            description: info.description
          }
        });
        index++;
      });
    }
    // hide all remaining
    for (let i = index; i < this.actor_actions.length; i++) {
      this.actor_actions[i].setup({ visible: false });
    }
  }

  destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.selectionChangedSubscription?.unsubscribe();
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
