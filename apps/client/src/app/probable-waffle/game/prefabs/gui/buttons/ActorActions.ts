// You can write more code here

/* START OF COMPILED CODE */

import OnPointerDownScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
/* START-USER-IMPORTS */
import ActorAction, { type ActorActionSetup } from "./ActorAction";
import { getCurrentPlayerNumber, listenToSelectionEvents } from "../../../data/scene-data";
import HudProbableWaffle from "../../../world/scenes/hud-scenes/HudProbableWaffle";
import { Subscription } from "rxjs";
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { AttackComponent } from "../../../entity/components/combat/components/attack-component";
import {
  AssignProductionErrorCode,
  ProductionComponent
} from "../../../entity/components/production/production-component";
import { ActorTranslateComponent } from "../../../entity/components/movement/actor-translate-component";
import { pwActorDefinitions } from "../../definitions/actor-definitions";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { AudioService } from "../../../world/services/audio.service";
import { BuilderComponent } from "../../../entity/components/construction/builder-component";
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import { getSceneComponent, getSceneService } from "../../../world/services/scene-component-helpers";
import { BuildingCursor } from "../../../player/human-controller/building-cursor";
import { ConstructionSiteComponent } from "../../../entity/components/construction/construction-site-component";
import HudMessages, { HudVisualFeedbackMessageType } from "../labels/HudMessages";
import { AudioSprites } from "../../../sfx/audio-sprites";
import { UiFeedbackSfx } from "../../../hud/UiFeedbackSfx";
import { CrossSceneCommunicationService } from "../../../world/services/CrossSceneCommunicationService";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { PawnAiController } from "../../ai-agents/pawn-ai-controller";
import { PlayerActionsHandler } from "../../../player/human-controller/player-actions-handler";
import { OrderType } from "../../../ai/order-type";
import { HealingComponent } from "../../../entity/components/combat/components/healing-component";
import { GathererComponent } from "../../../entity/components/resource/gatherer-component";
import { getPrimarySelectedActor } from "../../../data/selection-helpers";
import { ProductionInvalidReason, ProductionValidator } from "../../../data/tech-tree/production-validator";
import { getCommunicator, getPlayer } from "../../../data/scene-data";
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

  private get HOTKEYS(): readonly string[] {
    return this.playerActionsHandler.getListHotkeys();
  }

  // keep UI in sync with handler
  private buildingModeSubscription?: Subscription;
  private resourceChangedSubscription?: Subscription;

  private subscribeToPlayerSelection() {
    this.selectionChangedSubscription = listenToSelectionEvents(this.scene)?.subscribe(() => {
      // deterministically pick the primary actor
      const { selectedActors, actorsByPriority, primaryActor } = getPrimarySelectedActor(this.mainSceneWithActors);
      if (selectedActors.length === 0) {
        this.hideAllActions();
        return;
      } else {
        const actor = primaryActor!;
        // local fallback; will be overridden by handler stream
        this.buildingMode = false;
        this.showActorActions(actor, actorsByPriority);
        this.subscribeToActorKillEvent(actor);
        this.subscribeToActorConstructionEvent(actor, actorsByPriority);
        this.subscribeToResourceChanges();
      }
    });

    // sync HUD with handler build mode toggles (e.g. keyboard 'B' / 'Esc')
    this.buildingModeSubscription = this.playerActionsHandler.buildingModeObservable?.subscribe((active) => {
      this.buildingMode = active;
      this.refreshForCurrentSelection();
    });
  }

  private refreshForCurrentSelection() {
    const { selectedActors, actorsByPriority, primaryActor } = getPrimarySelectedActor(this.mainSceneWithActors);
    if (!selectedActors.length || !primaryActor) {
      this.hideAllActions();
      return;
    }
    this.showActorActions(primaryActor, actorsByPriority);
  }

  private hideAllActions() {
    this.actor_actions.forEach((action) => {
      action.setup({ visible: false });
    });
    this.resourceChangedSubscription?.unsubscribe();
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

  private subscribeToResourceChanges() {
    this.resourceChangedSubscription?.unsubscribe();
    const playerNr = getCurrentPlayerNumber(this.mainSceneWithActors);
    if (!playerNr) return;
    this.resourceChangedSubscription = getCommunicator(this.mainSceneWithActors)
      .playerChanged?.onWithFilter((p) => p.data.playerNumber === playerNr && p.property.startsWith("resource."))
      .subscribe(() => {
        this.refreshForCurrentSelection();
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
      },
      shortcut: "a"
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
      },
      shortcut: "h"
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
      },
      shortcut: "g"
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
      },
      shortcut: "s"
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
      },
      shortcut: "m"
    }) satisfies ActorActionSetup;

  private readonly rallyAction = (actors: Phaser.GameObjects.GameObject[]) =>
    ({
      icon: {
        key: "gui",
        frame: "action_icons/element.png", // todo
        origin: { x: 0.5, y: 0.5 }
      },
      visible: true,
      action: () => {
        this.playerActionsHandler.startOrderCommand(OrderType.Move, actors);
      },
      tooltipInfo: {
        title: "Rally point",
        description: "Set rally point for this building",
        iconKey: "gui",
        iconFrame: "action_icons/element.png", // todo
        iconOrigin: { x: 0.5, y: 0.5 }
      },
      shortcut: "v"
    }) satisfies ActorActionSetup;

  private showActorActions(actor: Phaser.GameObjects.GameObject, allActors: Phaser.GameObjects.GameObject[]) {
    this.hideAllIcons();
    let index = 0;

    if (!this.canShowIcons(actor)) return;

    // Add this block for ConstructionSiteComponent unfinished state
    const constructionSiteComponent = getActorComponent(actor, ConstructionSiteComponent);
    if (constructionSiteComponent && !constructionSiteComponent.isFinished) {
      // Show sword icon as 9th (bottom right) icon
      const action = this.actor_actions[8];
      if (!action) {
        console.error("Action button not found at index", index);
        return;
      }
      action.setup({
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
        },
        shortcut: "esc"
      });
      return;
    }

    if (this.buildingMode) {
      this.showBuildableIcons(actor, allActors, index);
    } else {
      index = this.showAttackIcons(actor, allActors, index);
      index = this.showMoveIcons(actor, allActors, index);
      index = this.showRallyPointIcon(actor, allActors, index);
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
      const action = this.actor_actions[index];
      if (!action) {
        console.error("Action button not found at index", index);
        return index;
      }
      action.setup(this.attackAction(allActors));
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
      const action = this.actor_actions[index];
      if (!action) {
        console.error("Action button not found at index", index);
        return index;
      }
      action.setup(this.moveAction(allActors));
      index++;
      action.setup(this.stopAction(allActors));
      index++;
    }
    return index;
  }

  private showRallyPointIcon(
    actor: Phaser.GameObjects.GameObject,
    allActors: Phaser.GameObjects.GameObject[],
    index: number
  ): number {
    const productionComponent = getActorComponent(actor, ProductionComponent);
    if (productionComponent) {
      const action = this.actor_actions[index];
      if (!action) {
        console.error("Action button not found at index", index);
        return index;
      }
      action.setup(this.rallyAction(allActors));
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
      const action = this.actor_actions[index];
      if (!action) {
        console.error("Action button not found at index", index);
        return index;
      }
      action.setup(this.healAction(allActors));
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
      const action = this.actor_actions[index];
      if (!action) {
        console.error("Action button not found at index", index);
        return index;
      }
      action.setup(this.gatherAction(allActors));
      index++;
    }
    return index;
  }

  private showProductionIcons(actor: Phaser.GameObjects.GameObject, index: number): number {
    const productionComponent = getActorComponent(actor, ProductionComponent);
    if (productionComponent && productionComponent.isFinished) {
      const availableToProduce = productionComponent.productionDefinition.availableProduceActors;
      availableToProduce.forEach((product: ObjectNames, localIndex: number): void => {
        const actorDefinition = pwActorDefinitions[product];
        const info = actorDefinition.components?.info;
        if (!info || !info.smallImage) {
          throw new Error(`Info component not found for ${product}`);
        }
        // UI validation gating
        const { disabled, disabledDescription, reason } = this.getProductionValidationState(product);

        const action = this.actor_actions[index];
        if (!action) {
          console.error("Action button not found at index", index);
          return;
        }
        action.setup({
          icon: {
            key: info.smallImage.key!,
            frame: info.smallImage.frame,
            origin: info.smallImage.origin
          },
          disabled,
          visible: true,
          action: () => {
            if (disabled) {
              this.playInvalidActionSfx(reason);
              return;
            }
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
            description: disabledDescription ?? info.description
          },
          // Use letter shortcuts from handler (Q..O)
          shortcut: this.HOTKEYS[localIndex]
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
      const action = this.actor_actions[index];
      if (!action) {
        console.error("Action button not found at index", index);
        return index;
      }
      action.setup({
        icon: {
          key: "gui",
          frame: "action_icons/hammer.png",
          origin: { x: 0.5, y: 0.5 }
        },
        visible: true,
        action: () => {
          // toggle build mode via handler so HUD and input stay in sync
          this.playerActionsHandler.setBuildingMode(true);
        },
        tooltipInfo: {
          title: "Build",
          description: "Build a building",
          iconKey: "gui",
          iconFrame: "action_icons/hammer.png",
          iconOrigin: { x: 0.5, y: 0.5 }
        },
        shortcut: "b"
      });
      index++;
    }
    return index;
  }

  private hideAllIcons() {
    for (let i = 0; i < this.actor_actions.length; i++) {
      this.actor_actions[i]!.setup({ visible: false });
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

    buildable.forEach((building, localIndex) => {
      if (index >= this.actor_actions.length) {
        console.error("Not enough slots for building icons");
        return;
      }
      const actorDefinition = pwActorDefinitions[building];
      const info = actorDefinition.components?.info;
      if (!info || !info.smallImage) {
        throw new Error(`Info component not found for ${building}`);
      }
      // UI validation gating
      const { disabled, disabledDescription, reason } = this.getProductionValidationState(building);

      const action = this.actor_actions[index];
      if (!action) {
        console.error("Action button not found at index", index);
        return;
      }
      action.setup({
        icon: {
          key: info.smallImage.key!,
          frame: info.smallImage.frame,
          origin: info.smallImage.origin
        },
        disabled,
        visible: true,
        action: () => {
          if (disabled) {
            this.playInvalidActionSfx(reason);
            return;
          }
          const buildingCursor = getSceneComponent(this.mainSceneWithActors, BuildingCursor);
          buildingCursor?.startPlacingBuilding.emit(building);
        },
        tooltipInfo: {
          title: info.name,
          iconKey: info.smallImage.key!,
          iconFrame: info.smallImage.frame,
          iconOrigin: info.smallImage.origin ?? { x: 0.5, y: 0.5 },
          description: disabledDescription ?? info.description
        },
        // Use letter shortcuts from handler (Q..O)
        shortcut: this.HOTKEYS[localIndex]
      });
      index++;
    });

    // increase index until it's at least 6 or higher, as we want back icon in the last row
    const toSkip = Math.max(6 - index, 0);
    index += toSkip;

    // add back button
    if (index >= this.actor_actions.length) {
      console.error("Not enough slots for building icons");
      return index;
    }
    const action = this.actor_actions[index];
    if (!action) {
      console.error("Action button not found at index", index);
      return index;
    }
    action.setup({
      icon: {
        key: "gui",
        frame: "action_icons/back.png",
        origin: { x: 0.5, y: 0.5 }
      },
      visible: true,
      action: () => {
        // turn off via handler to sync with input system and cursor
        this.playerActionsHandler.setBuildingMode(false);
      },
      tooltipInfo: {
        title: "Stop Building",
        description: "Stop building",
        iconKey: "gui",
        iconFrame: "action_icons/back.png",
        iconOrigin: { x: 0.5, y: 0.5 }
      },
      shortcut: "esc"
    });

    return index;
  }

  private getProductionValidationState(objectName: ObjectNames): {
    disabled: boolean;
    disabledDescription: string | null;
    reason: ProductionInvalidReason | null;
  } {
    const playerNumber = getCurrentPlayerNumber(this.mainSceneWithActors)!;
    const validation = ProductionValidator.validateObject(this.mainSceneWithActors, playerNumber, objectName);
    let disabled = !!validation?.prereqs?.length;
    let disabledDescription: string | null = null;
    let reason: ProductionInvalidReason | null = null;
    if (disabled) {
      disabledDescription = `Requires: ${validation!.prereqs.join(", ")}`;
      reason = ProductionInvalidReason.TechLocked;
    }

    const actorDefinition = pwActorDefinitions[objectName];
    const player = getPlayer(this.mainSceneWithActors, playerNumber);
    const cost = actorDefinition.components?.productionCost;
    if (player && cost && !player.canPayAllResources(cost.resources)) {
      disabled = true;
      if (!disabledDescription) {
        disabledDescription = "Not enough resources";
        reason = ProductionInvalidReason.NotEnoughResources;
      }
    }

    return { disabled, disabledDescription, reason };
  }

  private playInvalidActionSfx(reason: ProductionInvalidReason | null) {
    switch (reason) {
      case ProductionInvalidReason.NotEnoughResources:
        this.audioService.playAudioSprite(AudioSprites.UI_FEEDBACK, UiFeedbackSfx.NOT_ENOUGH_RESOURCES);
        break;
      case ProductionInvalidReason.TechLocked:
        this.audioService.playAudioSprite(AudioSprites.UI_FEEDBACK, UiFeedbackSfx.BUILD_DENIED); // TODO
        break;
      case ProductionInvalidReason.SupplyBlocked:
        this.audioService.playAudioSprite(AudioSprites.UI_FEEDBACK, UiFeedbackSfx.BUILD_DENIED); // TODO
        break;
      default:
        this.audioService.playAudioSprite(AudioSprites.UI_FEEDBACK, UiFeedbackSfx.BUILD_DENIED);
        break;
    }
  }

  override destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.selectionChangedSubscription?.unsubscribe();
    this.actorKillSubscription?.unsubscribe();
    this.actorConstructionSubscription?.unsubscribe();
    this.buildingModeSubscription?.unsubscribe();
    this.resourceChangedSubscription?.unsubscribe();
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
