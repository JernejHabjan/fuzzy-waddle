// You can write more code here

/* START OF COMPILED CODE */

import OnPointerDownScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
/* START-USER-IMPORTS */
import ActorAction, { ActorActionSetup } from "./ActorAction";
import {
  getCurrentPlayerNumber,
  getSelectedActors,
  listenToSelectionEvents,
  sortActorsByPriority
} from "../../../data/scene-data";
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
import { HealthComponent } from "../../../entity/combat/components/health-component";
import { AudioService } from "../../../scenes/services/audio.service";
import { BuilderComponent } from "../../../entity/actor/components/builder-component";
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { getSceneComponent, getSceneService } from "../../../scenes/components/scene-component-helpers";
import { BuildingCursor } from "../../../world/managers/controllers/building-cursor";
import { ConstructionSiteComponent } from "../../../entity/building/construction/construction-site-component";
import HudMessages, { HudVisualFeedbackMessageType } from "../labels/HudMessages";
import { AudioSprites } from "../../../sfx/AudioSprites";
import { UiFeedbackSfx } from "../../../sfx/UiFeedbackSfx";
import { CrossSceneCommunicationService } from "../../../scenes/services/CrossSceneCommunicationService";
import { OwnerComponent } from "../../../entity/actor/components/owner-component";
import { PawnAiController } from "../../../world/managers/controllers/player-pawn-ai-controller/pawn-ai-controller";
import { PlayerActionsHandler } from "../../../world/managers/controllers/PlayerActionsHandler";
import { OrderType } from "../../../entity/character/ai/order-type";
import { HealingComponent } from "../../../entity/combat/components/healing-component";
import { GathererComponent } from "../../../entity/actor/components/gatherer-component";
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

    // preventDefaultScript
    new OnPointerDownScript(actor_actions_bg);

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
    this.mainSceneWithActors = (scene as HudProbableWaffle).probableWaffleScene!;
    this.audioService = getSceneService(this.mainSceneWithActors, AudioService)!;
    this.playerActionsHandler = getSceneService(this.mainSceneWithActors, PlayerActionsHandler)!;
    this.subscribeToPlayerSelection();
    this.hideAllActions();
    /* END-USER-CTR-CODE */
  }

  private actor_actions: ActorAction[];

  /* START-USER-CODE */
  private selectionChangedSubscription?: Subscription;
  private actorKillSubscription?: Subscription;
  private actorConstructionSubscription?: Subscription;
  private readonly mainSceneWithActors: ProbableWaffleScene;
  private readonly audioService: AudioService;
  private readonly playerActionsHandler: PlayerActionsHandler;
  /**
   * If true, building icons are displayed with back button
   */
  private buildingMode: boolean = false;

  private subscribeToPlayerSelection() {
    this.selectionChangedSubscription = listenToSelectionEvents(this.scene)?.subscribe(() => {
      // deterministically pick the primary actor
      const { selectedActors, actorsByPriority, primaryActor } = getPrimarySelectedActor(this.mainSceneWithActors);
      if (selectedActors.length === 0) {
        this.hideAllActions();
        return;
      } else {
        const actor = primaryActor!;
        this.buildingMode = false;
        this.showActorActions(actor, actorsByPriority);
        this.subscribeToActorKillEvent(actor);
        this.subscribeToActorConstructionEvent(actor, actorsByPriority);
      }
    });
  }

  private hideAllActions() {
    this.actor_actions.forEach((action) => {
      action.setup({ visible: false });
    });
  }

  private subscribeToActorKillEvent(actor: Phaser.GameObjects.GameObject) {
    this.actorKillSubscription?.unsubscribe();
    this.actorKillSubscription = getActorComponent(actor, HealthComponent)?.healthChanged.subscribe((newHealth) => {
      if (newHealth <= 0) {
        this.hideAllActions();
      }
    });
  }

  private subscribeToActorConstructionEvent(
    actor: Phaser.GameObjects.GameObject,
    allActors: Phaser.GameObjects.GameObject[]
  ) {
    this.actorConstructionSubscription?.unsubscribe();
    this.actorConstructionSubscription = getActorComponent(
      actor,
      ConstructionSiteComponent
    )?.constructionProgressPercentageChanged.subscribe((progress) => {
      if (progress === 100) {
        // show actions again
        this.showActorActions(actor, allActors);
      }
    });
  }

  private readonly attackAction = (actors: Phaser.GameObjects.GameObject[]) =>
    ({
      icon: {
        key: "gui",
        frame: "actor_info_icons/sword.png",
        origin: { x: 0.5, y: 0.5 }
      },
      visible: true,
      action: () => {
        this.playerActionsHandler.startOrderCommand(OrderType.Attack, actors);
      },
      tooltipInfo: {
        title: "Attack",
        description: "Attack an enemy or start attack-move to certain location",
        iconKey: "gui",
        iconFrame: "actor_info_icons/sword.png",
        iconOrigin: { x: 0.5, y: 0.5 }
      }
    }) satisfies ActorActionSetup;

  private readonly healAction = (actors: Phaser.GameObjects.GameObject[]) =>
    ({
      icon: {
        key: "gui",
        frame: "actor_info_icons/element.png", // todo
        origin: { x: 0.5, y: 0.5 }
      },
      visible: true,
      action: () => {
        this.playerActionsHandler.startOrderCommand(OrderType.Heal, actors);
      },
      tooltipInfo: {
        title: "Heal",
        description: "Heal an ally",
        iconKey: "gui",
        iconFrame: "actor_info_icons/element.png", // todo
        iconOrigin: { x: 0.5, y: 0.5 }
      }
    }) satisfies ActorActionSetup;

  private readonly gatherAction = (actors: Phaser.GameObjects.GameObject[]) =>
    ({
      icon: {
        key: "gui",
        frame: "action_icons/element.png", // todo
        origin: { x: 0.5, y: 0.5 }
      },
      visible: true,
      action: () => {
        this.playerActionsHandler.startOrderCommand(OrderType.Gather, actors);
      },
      tooltipInfo: {
        title: "Gather",
        description: "Gather resources from a resource node",
        iconKey: "gui",
        iconFrame: "action_icons/element.png", // todo
        iconOrigin: { x: 0.5, y: 0.5 }
      }
    }) satisfies ActorActionSetup;

  private readonly stopAction = (actors: Phaser.GameObjects.GameObject[]) =>
    ({
      icon: {
        key: "gui",
        frame: "action_icons/hand.png",
        origin: { x: 0.5, y: 0.5 }
      },
      visible: true,
      action: () => {
        actors.forEach((actor) => {
          const pawnAiController = getActorComponent(actor, PawnAiController);
          if (!pawnAiController) return;
          pawnAiController?.blackboard.resetCurrentOrder();
        });
      },
      tooltipInfo: {
        title: "Stop",
        description: "Stop current action",
        iconKey: "gui",
        iconFrame: "action_icons/hand.png",
        iconOrigin: { x: 0.5, y: 0.5 }
      }
    }) satisfies ActorActionSetup;

  private readonly moveAction = (actors: Phaser.GameObjects.GameObject[]) =>
    ({
      icon: {
        key: "gui",
        frame: "action_icons/arrow.png",
        origin: { x: 0.5, y: 0.5 }
      },
      visible: true,
      action: () => {
        this.playerActionsHandler.startOrderCommand(OrderType.Move, actors);
      },
      tooltipInfo: {
        title: "Move",
        description: "Move to a location",
        iconKey: "gui",
        iconFrame: "action_icons/arrow.png",
        iconOrigin: { x: 0.5, y: 0.5 }
      }
    }) satisfies ActorActionSetup;

  private showActorActions(actor: Phaser.GameObjects.GameObject, allActors: Phaser.GameObjects.GameObject[]) {
    this.hideAllIcons();
    let index = 0;

    if (!this.canShowIcons(actor)) return;

    // Add this block for ConstructionSiteComponent unfinished state
    const constructionSiteComponent = getActorComponent(actor, ConstructionSiteComponent);
    if (constructionSiteComponent && !constructionSiteComponent.isFinished) {
      // Show sword icon as 9th (bottom right) icon
      this.actor_actions[8].setup({
        icon: {
          key: "gui",
          frame: "action_icons/hand.png",
          origin: { x: 0.5, y: 0.5 }
        },
        visible: true,
        action: () => {
          const healthComponent = getActorComponent(actor, HealthComponent);
          healthComponent?.killActor();
        },
        tooltipInfo: {
          title: "Cancel construction",
          description: "This action will destroy the building",
          iconKey: "gui",
          iconFrame: "action_icons/hand.png",
          iconOrigin: { x: 0.5, y: 0.5 }
        }
      });
      return;
    }

    if (this.buildingMode) {
      this.showBuildableIcons(actor, allActors, index);
    } else {
      index = this.showAttackIcons(actor, allActors, index);
      index = this.showMoveIcons(actor, allActors, index);
      index = this.showHealIcons(actor, allActors, index);
      index = this.showGatherIcons(actor, allActors, index);
      index = this.showProductionIcons(actor, index);
      this.showBuilderIcons(actor, allActors, index);
    }
  }

  private canShowIcons(actor: Phaser.GameObjects.GameObject) {
    const currentPlayerNr = getCurrentPlayerNumber(this.mainSceneWithActors);
    const actorPlayerNr = getActorComponent(actor, OwnerComponent)?.getOwner();
    return actorPlayerNr === currentPlayerNr;
  }

  private showAttackIcons(
    actor: Phaser.GameObjects.GameObject,
    allActors: Phaser.GameObjects.GameObject[],
    index: number
  ): number {
    const attackComponent = getActorComponent(actor, AttackComponent);
    if (attackComponent) {
      this.actor_actions[index].setup(this.attackAction(allActors));
      index++;
    }
    return index;
  }

  private showMoveIcons(
    actor: Phaser.GameObjects.GameObject,
    allActors: Phaser.GameObjects.GameObject[],
    index: number
  ): number {
    const actorTranslateComponent = getActorComponent(actor, ActorTranslateComponent);
    if (actorTranslateComponent) {
      this.actor_actions[index].setup(this.moveAction(allActors));
      index++;
      this.actor_actions[index].setup(this.stopAction(allActors));
      index++;
    }
    return index;
  }

  private showHealIcons(
    actor: Phaser.GameObjects.GameObject,
    allActors: Phaser.GameObjects.GameObject[],
    index: number
  ): number {
    const healingComponent = getActorComponent(actor, HealingComponent);
    if (healingComponent) {
      this.actor_actions[index].setup(this.healAction(allActors));
      index++;
    }
    return index;
  }

  private showGatherIcons(
    actor: Phaser.GameObjects.GameObject,
    allActors: Phaser.GameObjects.GameObject[],
    index: number
  ): number {
    const gathererComponent = getActorComponent(actor, GathererComponent);
    if (gathererComponent) {
      this.actor_actions[index].setup(this.gatherAction(allActors));
      index++;
    }
    return index;
  }

  private showProductionIcons(actor: Phaser.GameObjects.GameObject, index: number): number {
    const productionComponent = getActorComponent(actor, ProductionComponent);
    if (productionComponent && productionComponent.isFinished) {
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
            const sound = this.mainSceneWithActors.sound;

            sound.stopByKey(AudioSprites.UI_FEEDBACK);

            const crossSceneCommunicationService = getSceneService(
              this.mainSceneWithActors,
              CrossSceneCommunicationService
            );
            switch (errorCode) {
              case AssignProductionErrorCode.NotEnoughResources:
                this.audioService.playAudioSprite(AudioSprites.UI_FEEDBACK, UiFeedbackSfx.NOT_ENOUGH_RESOURCES);
                crossSceneCommunicationService?.emit(
                  HudMessages.HudVisualFeedbackMessageEventName,
                  HudVisualFeedbackMessageType.NotEnoughResources
                );
                break;
              case AssignProductionErrorCode.QueueFull:
                this.audioService.playAudioSprite(AudioSprites.UI_FEEDBACK, UiFeedbackSfx.PRODUCTION_QUEUE_FULL);
                crossSceneCommunicationService?.emit(
                  HudMessages.HudVisualFeedbackMessageEventName,
                  HudVisualFeedbackMessageType.ProductionQueueFull
                );
                break;
              case AssignProductionErrorCode.NotFinished:
                console.error("Not finished");
                break;
              case AssignProductionErrorCode.InvalidProduct:
                console.error("Invalid product");
                break;
              case AssignProductionErrorCode.NoOwner:
                console.error("No owner");
                break;
            }
          },
          tooltipInfo: {
            title: info.name,
            iconKey: info.smallImage.key!,
            iconFrame: info.smallImage.frame,
            iconOrigin: info.smallImage.origin ?? { x: 0.5, y: 0.5 },
            description: info.description
          }
        });
        index++;
      });
    }
    return index;
  }

  private showBuilderIcons(
    actor: Phaser.GameObjects.GameObject,
    allActors: Phaser.GameObjects.GameObject[],
    index: number
  ): number {
    const builderComponent = getActorComponent(actor, BuilderComponent);
    if (builderComponent) {
      this.actor_actions[index].setup({
        icon: {
          key: "gui",
          frame: "action_icons/hammer.png",
          origin: { x: 0.5, y: 0.5 }
        },
        visible: true,
        action: () => {
          this.buildingMode = true;
          this.showActorActions(actor, allActors);
        },
        tooltipInfo: {
          title: "Build",
          description: "Build a building",
          iconKey: "gui",
          iconFrame: "action_icons/hammer.png",
          iconOrigin: { x: 0.5, y: 0.5 }
        }
      });
      index++;
    }
    return index;
  }

  private hideAllIcons() {
    for (let i = 0; i < this.actor_actions.length; i++) {
      this.actor_actions[i].setup({ visible: false });
    }
  }

  private showBuildableIcons(
    actor: Phaser.GameObjects.GameObject,
    allActors: Phaser.GameObjects.GameObject[],
    index: number
  ): number {
    const builderComponent = getActorComponent(actor, BuilderComponent);
    if (!builderComponent) throw new Error("BuilderComponent not found");
    const buildable: ObjectNames[] = builderComponent.constructableBuildings;

    for (const building of buildable) {
      if (index >= this.actor_actions.length) {
        console.error("Not enough slots for building icons");
        return index;
      }
      const actorDefinition = pwActorDefinitions[building];
      const info = actorDefinition.components?.info;
      if (!info || !info.smallImage) {
        throw new Error(`Info component not found for ${building}`);
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
          const buildingCursor = getSceneComponent(this.mainSceneWithActors, BuildingCursor);
          buildingCursor?.startPlacingBuilding.emit(building);
        },
        tooltipInfo: {
          title: info.name,
          iconKey: info.smallImage.key!,
          iconFrame: info.smallImage.frame,
          iconOrigin: info.smallImage.origin ?? { x: 0.5, y: 0.5 },
          description: info.description
        }
      });
      index++;
    }

    // increase index until it's at least 6 or higher, as we want back icon in the last row
    const toSkip = Math.max(6 - index, 0);
    index += toSkip;

    // add back button
    if (index >= this.actor_actions.length) {
      console.error("Not enough slots for building icons");
      return index;
    }
    this.actor_actions[index].setup({
      icon: {
        key: "gui",
        frame: "action_icons/back.png",
        origin: { x: 0.5, y: 0.5 }
      },
      visible: true,
      action: () => {
        this.buildingMode = false;
        this.showActorActions(actor, allActors);
        const buildingCursor = getSceneComponent(this.mainSceneWithActors, BuildingCursor);
        buildingCursor?.stopPlacingBuilding.emit();
      },
      tooltipInfo: {
        title: "Stop Building",
        description: "Stop building",
        iconKey: "gui",
        iconFrame: "action_icons/back.png",
        iconOrigin: { x: 0.5, y: 0.5 }
      }
    });

    return index;
  }

  destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.selectionChangedSubscription?.unsubscribe();
    this.actorKillSubscription?.unsubscribe();
    this.actorConstructionSubscription?.unsubscribe();
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
