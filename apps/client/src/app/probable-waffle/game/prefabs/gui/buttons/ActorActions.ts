// You can write more code here

/* START OF COMPILED CODE */

import OnPointerDownScript from "../../../../../shared/game/phaser/script-nodes-basic/OnPointerDownScript";
/* START-USER-IMPORTS */
import ActorAction from "./ActorAction";
import { getCommunicator, getCurrentPlayerNumber, getPlayer, listenToSelectionEvents } from "../../../data/scene-data";
import HudProbableWaffle from "../../../world/scenes/hud-scenes/HudProbableWaffle";
import { Subscription } from "rxjs";
import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { AttackComponent } from "../../../entity/components/combat/components/attack-component";
import { ProductionComponent } from "../../../entity/components/production/production-component";
import { ActorTranslateComponent } from "../../../entity/components/movement/actor-translate-component";
import { getPwActorDefinition } from "../../definitions/actor-definitions";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { AudioService } from "../../../world/services/audio.service";
import { BuilderComponent } from "../../../entity/components/construction/builder-component";
import type { PreRequirement, PreRequirementType } from "@fuzzy-waddle/api-interfaces";
import { ObjectNames, ResearchType } from "@fuzzy-waddle/api-interfaces";
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
import { ProductionValidator } from "../../../data/tech-tree/production-validator";
import { findProductionBuildingWithLeastRemainingTime } from "../../../entity/components/production/production-helpers";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import {
  dispatchCancelResearchCommand,
  dispatchProductionCommand,
  dispatchResearchCommand
} from "../../../data/commands/queue-command-dispatch";
import {
  type ConstructableCategory,
  ConstructableDefinition
} from "../../../entity/components/construction/constructable-category";
import { SelectionTabHandler } from "../../../player/human-controller/selection-tab-handler";
import type { ActorActionSetup } from "./actor-action-setup";
import { SpellComponent } from "../../../entity/components/combat/components/spell-component";
import { spellDefinitions } from "../../../entity/components/combat/spell-definitions";
import { SpellCursor } from "../../../player/human-controller/spell-cursor";
import type { SpellType } from "../../../entity/components/combat/spell-type";
import { ResearchComponent } from "../../../entity/components/research/research-component";
import { researchDefinitions } from "../../../entity/components/research/research-definitions";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import { QueueItemType } from "../../../entity/components/queue/queue-item";
import { ContainerComponent } from "../../../entity/components/building/container-component";
import { NavigationService } from "../../../world/services/navigation.service";
import { isWaterUnit } from "../../../data/game-object-helper";
/* END-USER-IMPORTS */

/**
 * HUD component displaying action buttons for selected actors (attack, move, build, produce units, research, etc.)
 */
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
    this.hudScene = scene as HudProbableWaffle;
    this.audioService = getSceneService(this.mainSceneWithActors, AudioService)!;
    this.playerActionsHandler = getSceneService(this.mainSceneWithActors, PlayerActionsHandler)!;
    this.subscribeToPlayerSelection();
    this.hideAllActions();
    this.mainSceneWithActors.events.on(
      PlayerActionsHandler.BUILDING_MODE_SHORTCUT_PRESSED,
      this.onBuildModeKeyDown,
      this
    );
    /* END-USER-CTR-CODE */
  }

  private actor_actions: ActorAction[];

  /* START-USER-CODE */
  private selectionChangedSubscription?: Subscription;
  private actorKillSubscription?: Subscription;
  private actorConstructionSubscription?: Subscription;
  private tabHandlerSubscription?: Subscription;
  private readonly mainSceneWithActors: ProbableWaffleScene;
  private readonly hudScene: HudProbableWaffle;
  private readonly audioService: AudioService;
  private readonly playerActionsHandler: PlayerActionsHandler;
  /** If true, building icons are displayed with back button */
  private buildingMode: boolean = false;
  /** Navigation stack for building categories. Empty array means root level. */
  private categoryNavigationStack: ConstructableCategory[] = [];

  private get HOTKEYS(): readonly string[] {
    return this.playerActionsHandler.getListHotkeys();
  }

  private buildingModeSubscription?: Subscription;
  private resourceChangedSubscription?: Subscription;
  private actorUnlockSubscription?: Subscription;
  private researchEventSubscriptions: Subscription[] = [];
  private spellCooldownSubscriptions: Subscription[] = [];
  private spellUpdateTimer?: Phaser.Time.TimerEvent;
  /** Refreshes container Unload button when the container actor moves to/from shore. */
  private containerMovementSubscription?: Subscription;

  /** Subscribe to selection changes and update displayed actions accordingly */
  private subscribeToPlayerSelection() {
    this.selectionChangedSubscription = listenToSelectionEvents(this.scene)?.subscribe(() => {
      // Update tab handler with new selection
      const tabHandler = getSceneComponent(this.mainSceneWithActors, SelectionTabHandler);
      if (tabHandler) {
        tabHandler.updateGroupedActors();
      }

      // deterministically pick the primary actor
      const { selectedActors, actorsByPriority, primaryActor } = getPrimarySelectedActor(this.mainSceneWithActors);
      if (selectedActors.length === 0) {
        this.hideAllActions();
        return;
      } else {
        const actor = primaryActor!;
        // local fallback; will be overridden by handler stream
        this.buildingMode = false;
        // Reset category navigation when selection changes
        this.categoryNavigationStack = [];
        this.showActorActions(actor, actorsByPriority);
        this.subscribeToActorKillEvent(actor);
        this.subscribeToActorConstructionEvent(actor, actorsByPriority);
        this.subscribeToResourceChanges();
        this.subscribeToActorUnlockEvents();
        this.subscribeToResearchChanges();
        this.subscribeToSpellCooldowns(actor);
      }
    });

    // sync HUD with handler build mode toggles (e.g. keyboard 'B' / 'Esc')
    this.buildingModeSubscription = this.playerActionsHandler.buildingModeObservable?.subscribe((active) => {
      this.buildingMode = active;
      // Reset category navigation when exiting building mode
      if (!active) {
        this.categoryNavigationStack = [];
      }
      this.refreshForCurrentSelection();
    });

    // Subscribe to tab changes to update actions display
    const tabHandler = getSceneComponent(this.mainSceneWithActors, SelectionTabHandler);
    if (tabHandler) {
      this.tabHandlerSubscription = tabHandler.currentTabIndex$.subscribe(() => {
        // Make sure this triggers after the other events
        setTimeout(() => {
          this.refreshForCurrentSelection();
        }, 50);
      });
    }
  }

  /** Handle hotkey presses when in building mode to trigger corresponding action buttons */
  private onBuildModeKeyDown(hotkeyIndex: number) {
    if (!this.buildingMode) return;

    if (hotkeyIndex === -1) return;

    // Find and trigger the corresponding action button
    const action = this.actor_actions[hotkeyIndex];
    if (action && action.visible) {
      action.triggerAction();
    }
  }

  private mapKeyToCode(k: string): string {
    return k.length === 1 ? `Key${k.toUpperCase()}` : k;
  }

  private refreshForCurrentSelection() {
    const { selectedActors, actorsByPriority, primaryActor } = getPrimarySelectedActor(this.mainSceneWithActors);
    if (!selectedActors.length || !primaryActor) {
      this.hideAllActions();
      return;
    }
    // Don't reset navigation stack here - it's managed elsewhere
    this.showActorActions(primaryActor, actorsByPriority);
  }

  private hideAllActions() {
    this.actor_actions.forEach((action) => {
      action.setup({ visible: false });
    });
    this.resourceChangedSubscription?.unsubscribe();
    this.containerMovementSubscription?.unsubscribe();
    this.stopSpellCooldownTimer();
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
        // Reset category navigation when construction finishes
        this.categoryNavigationStack = [];
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

  private subscribeToActorUnlockEvents() {
    // Unsubscribe from previous subscription
    this.actorUnlockSubscription?.unsubscribe();

    const playerNr = getCurrentPlayerNumber(this.mainSceneWithActors);
    if (!playerNr) return;

    // Subscribe to actor unlock events from ActorIndexSystem
    const actorIndex = getSceneService(this.mainSceneWithActors, ActorIndexSystem);
    if (!actorIndex) return;

    this.actorUnlockSubscription = actorIndex.actorUnlockRegistered.subscribe((event) => {
      // Only refresh if the unlock is for the current player
      if (event.playerNumber === playerNr) {
        // When a new actor is unlocked (building finishes construction), refresh the UI
        this.refreshForCurrentSelection();
        // Re-subscribe to research changes to pick up newly constructed buildings with research
        this.subscribeToResearchChanges();
      }
    });
  }

  private subscribeToResearchChanges() {
    // Unsubscribe from all previous research subscriptions
    this.researchEventSubscriptions.forEach((sub) => sub.unsubscribe());
    this.researchEventSubscriptions = [];

    const playerNr = getCurrentPlayerNumber(this.mainSceneWithActors);
    if (!playerNr) return;

    // Get all owned actors with research components
    const actorIndex = getSceneService(this.mainSceneWithActors, ActorIndexSystem);
    if (!actorIndex) return;

    const ownedActors = actorIndex.getOwnedActors(playerNr);

    // Subscribe to research events for all owned buildings
    ownedActors.forEach((actor) => {
      const researchComponent = getActorComponent(actor, ResearchComponent);
      if (researchComponent) {
        // Research started - refresh all buildings (hide started research from all)
        const startedSub = researchComponent.researchStarted.subscribe(() => {
          this.refreshForCurrentSelection();
        });
        this.researchEventSubscriptions.push(startedSub);

        // Research completed - refresh all (hide from buildings, unlock spells on units)
        const completedSub = researchComponent.researchCompleted.subscribe(() => {
          this.refreshForCurrentSelection();
        });
        this.researchEventSubscriptions.push(completedSub);

        // Research cancelled - refresh all (show research icons again)
        const cancelledSub = researchComponent.researchCancelled.subscribe(() => {
          this.refreshForCurrentSelection();
        });
        this.researchEventSubscriptions.push(cancelledSub);
      }
    });
  }

  /** Action definition for attack command */
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
        frame: "action_icons/heal.png",
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
        iconFrame: "action_icons/heal.png",
        iconOrigin: { x: 0.5, y: 0.5 }
      },
      shortcut: "h"
    }) satisfies ActorActionSetup;

  private readonly gatherAction = (actors: Phaser.GameObjects.GameObject[]) =>
    ({
      icon: {
        key: "gui",
        frame: "action_icons/gather.png",
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
        iconFrame: "action_icons/gather.png",
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
        frame: "action_icons/rally.png",
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
        iconFrame: "action_icons/rally.png",
        iconOrigin: { x: 0.5, y: 0.5 }
      },
      shortcut: "v"
    }) satisfies ActorActionSetup;

  private readonly deleteAction = (actor: Phaser.GameObjects.GameObject, allActors: Phaser.GameObjects.GameObject[]) =>
    ({
      icon: {
        key: "gui",
        frame: "action_icons/hand.png",
        origin: { x: 0.5, y: 0.5 }
      },
      visible: true,
      action: async () => {
        // Check if it's a main building
        const actorName = actor.name;
        const actorDefinition = getPwActorDefinition(actorName, null);
        const isMainBuilding = actorDefinition?.meta?.isMainBuilding ?? false;

        if (isMainBuilding) {
          const confirmed = await this.hudScene.confirmationDialog.show(
            "Are you sure you want to delete this main building? This action cannot be undone."
          );
          if (!confirmed) {
            return;
          }
        }

        // Delete all selected actors
        allActors.forEach((actorToDelete) => {
          const healthComponent = getActorComponent(actorToDelete, HealthComponent);
          healthComponent?.killActor();
        });
      },
      tooltipInfo: {
        title: "Delete",
        description: "Delete selected actor(s)",
        iconKey: "gui",
        iconFrame: "action_icons/hand.png",
        iconOrigin: { x: 0.5, y: 0.5 }
      },
      shortcut: "del"
    }) satisfies ActorActionSetup;

  /** Main method to display action buttons based on selected actor's components */
  private showActorActions(actor: Phaser.GameObjects.GameObject, allActors: Phaser.GameObjects.GameObject[]) {
    this.hideAllIcons();
    let index = 0;

    if (!this.canShowIcons(actor)) return;

    // Add this block for ConstructionSiteComponent unfinished state
    const constructionSiteComponent = getActorComponent(actor, ConstructionSiteComponent);
    if (constructionSiteComponent && !constructionSiteComponent.isFinished) {
      // Reset category navigation when showing construction site
      this.categoryNavigationStack = [];
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
      // Reset category navigation when not in building mode
      this.categoryNavigationStack = [];
      index = this.showAttackIcons(actor, allActors, index);
      index = this.showMoveIcons(actor, allActors, index);
      index = this.showRallyPointIcon(actor, allActors, index);
      index = this.showHealIcons(actor, allActors, index);
      index = this.showSpellIcons(actor, allActors, index);
      index = this.showGatherIcons(actor, allActors, index);
      index = this.showContainerIcons(actor, allActors, index);
      index = this.showProductionIcons(actor, allActors, index);
      index = this.showResearchIcons(actor, allActors, index);
      index = this.showBuilderIcons(actor, allActors, index);
      // Always show delete button at the bottom-right position
      this.showDeleteIcon(actor, allActors, index);
    }
  }

  /** Check if the actor belongs to the current player */
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

  private showSpellIcons(
    actor: Phaser.GameObjects.GameObject,
    allActors: Phaser.GameObjects.GameObject[],
    index: number
  ): number {
    const spellComponent = getActorComponent(actor, SpellComponent);
    if (!spellComponent) return index;

    const spellCursor = getSceneService(this.mainSceneWithActors, SpellCursor);

    spellComponent.availableSpells.forEach((spellType, localIndex) => {
      const spellData = spellDefinitions[spellType];
      if (!spellData) return;

      const isResearched = spellComponent.isSpellResearched(spellType);

      // Hide spells that require research but haven't been researched yet
      if (!isResearched && spellData.requiresResearch) {
        return;
      }

      const action = this.actor_actions[index];
      if (!action) {
        console.error("Action button not found at index", index);
        return;
      }

      const cooldownProgress = spellComponent.getCooldownProgress(spellType);
      const cooldownRemaining = spellComponent.getCooldownRemaining(spellType);
      const autocastEnabled = spellComponent.isAutocastEnabled(spellType);

      // Use validation state similar to production
      const { disabled, unmetRequirements } = this.getSpellValidationState(spellType, spellComponent);

      action.setup({
        icon: {
          key: spellData.icon.key,
          frame: spellData.icon.frame,
          origin: { x: 0.5, y: 0.5 }
        },
        visible: true,
        disabled,
        cooldownProgress: cooldownProgress < 100 ? cooldownProgress : undefined,
        cooldownRemaining: cooldownRemaining > 0 ? cooldownRemaining : undefined,
        autocastEnabled: isResearched && autocastEnabled,
        action: () => {
          if (disabled) return;
          // Activate spell cursor for ground-target spells
          if (spellCursor) {
            spellCursor.startCastingSpell.emit(spellType);
          }
        },
        onRightClick: () => {
          // Toggle autocast on right-click
          spellComponent.toggleAutocast(spellType);
          // Update autocast indicator immediately
          const newAutocastState = spellComponent.isAutocastEnabled(spellType);
          action.setAutocastIndicator(newAutocastState);
        },
        tooltipInfo: {
          title: spellData.name,
          description: spellData.description,
          iconKey: spellData.icon.key,
          iconFrame: spellData.icon.frame,
          iconOrigin: { x: 0.5, y: 0.5 },
          unmetRequirements: unmetRequirements ?? undefined
        },
        // Use hotkey from position (Q, W, E, R, T, Y, U, I, O)
        shortcut: this.HOTKEYS[localIndex]
      } satisfies ActorActionSetup);
      index++;
    });

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

  private showContainerIcons(
    actor: Phaser.GameObjects.GameObject,
    _allActors: Phaser.GameObjects.GameObject[],
    index: number
  ): number {
    // Always clean up any stale movement subscription when rebuilding the action bar
    this.containerMovementSubscription?.unsubscribe();

    const containerComponent = getActorComponent(actor, ContainerComponent);
    if (!containerComponent) return index;

    const hasUnits = containerComponent.getContainedGameObjects().length > 0;

    // Shore check only applies to water units — ground containers can always unload
    let isOnShore = true;
    if (isWaterUnit(actor)) {
      const navigationService = getSceneService(this.mainSceneWithActors, NavigationService);
      const tile = navigationService?.getCenterTileCoordUnderObject(actor);
      isOnShore = tile ? (navigationService?.isShoreTile(tile) ?? false) : false;
    }

    const canUnload = hasUnits && isOnShore;

    const action = this.actor_actions[index];
    if (!action) {
      console.error("Action button not found at index", index);
      return index;
    }

    const tooltipDescription = !hasUnits
      ? "No units to unload"
      : isWaterUnit(actor) && !isOnShore
        ? "Must be docked at a shore tile to unload"
        : "Unload all carried units";

    action.setup({
      icon: {
        key: "gui",
        frame: "action_icons/hand.png",
        origin: { x: 0.5, y: 0.5 }
      },
      visible: true,
      disabled: !canUnload,
      action: () => {
        if (!canUnload) return;
        containerComponent.unloadAll();
      },
      tooltipInfo: {
        title: "Unload All",
        description: tooltipDescription,
        iconKey: "gui",
        iconFrame: "action_icons/hand.png",
        iconOrigin: { x: 0.5, y: 0.5 }
      },
      shortcut: "u"
    } satisfies ActorActionSetup);
    index++;

    // Refresh the button when the actor moves to/from a shore tile
    this.containerMovementSubscription?.unsubscribe();
    const translateComponent = getActorComponent(actor, ActorTranslateComponent);
    if (translateComponent) {
      this.containerMovementSubscription = translateComponent.actorMovedLogicalPosition.subscribe(() => {
        this.refreshForCurrentSelection();
      });
    }

    return index;
  }

  private showProductionIcons(
    actor: Phaser.GameObjects.GameObject,
    allActors: Phaser.GameObjects.GameObject[],
    index: number
  ): number {
    const productionComponent = getActorComponent(actor, ProductionComponent);
    if (productionComponent && productionComponent.isFinished) {
      const availableToProduce = productionComponent.productionDefinition.availableProduceActors;
      availableToProduce.forEach((product: ObjectNames, localIndex: number): void => {
        const actorDefinition = getPwActorDefinition(product, null);
        const info = actorDefinition?.components?.info;
        if (!info || !info.smallImage) {
          throw new Error(`Info component not found for ${product}`);
        }
        // UI validation gating
        const { disabled, validation } = this.getProductionValidationState(product);

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
              this.playInvalidActionSfx();
              return;
            }
            if (!actorDefinition?.components?.productionCost) {
              throw new Error(`Production cost not found for ${product}`);
            }

            // Find the production building with the least total remaining production time
            const targetComponent = findProductionBuildingWithLeastRemainingTime(allActors);
            const playerNumber = getCurrentPlayerNumber(this.mainSceneWithActors);
            if (!targetComponent || !playerNumber) {
              console.error("No production building found");
              return;
            }

            const dispatched = dispatchProductionCommand(this.mainSceneWithActors, allActors, playerNumber, product);
            const sound = this.mainSceneWithActors.sound;

            sound.stopByKey(AudioSprites.UI_FEEDBACK);

            const crossSceneCommunicationService = getSceneService(
              this.mainSceneWithActors,
              CrossSceneCommunicationService
            );
            switch (dispatched) {
              case false:
                this.audioService.playAudioSprite(AudioSprites.UI_FEEDBACK, UiFeedbackSfx.NOT_ENOUGH_RESOURCES);
                crossSceneCommunicationService?.emit(
                  HudMessages.HudVisualFeedbackMessageEventName,
                  HudVisualFeedbackMessageType.NotEnoughResources
                );
                break;
              case true:
                this.audioService.playAudioSprite(AudioSprites.UI_FEEDBACK, UiFeedbackSfx.BUTTON_CLICK);
                break;
            }
          },
          tooltipInfo: {
            title: info.name,
            iconKey: info.smallImage.key!,
            iconFrame: info.smallImage.frame,
            iconOrigin: info.smallImage.origin ?? { x: 0.5, y: 0.5 },
            description: info.description,
            definition: actorDefinition,
            unmetRequirements: validation?.prereqs
          },
          // Use letter shortcuts from handler (Q..O)
          shortcut: this.HOTKEYS[localIndex]
        });
        index++;
      });
    }
    return index;
  }

  private showResearchIcons(
    actor: Phaser.GameObjects.GameObject,
    _allActors: Phaser.GameObjects.GameObject[],
    index: number
  ): number {
    const researchComponent = getActorComponent(actor, ResearchComponent);
    if (!researchComponent) return index;

    for (const researchType of researchComponent.availableResearch) {
      const researchData = researchDefinitions[researchType];
      if (!researchData) continue;

      // Hide research that has unmet prerequisites — those will appear once their prerequisite is done
      if (researchData.prerequisiteResearch?.some((prereq) => !researchComponent.isResearched(prereq))) continue;

      const action = this.actor_actions[index];
      if (!action) {
        console.error("Action button not found at index", index);
        return index;
      }

      // Skip if already fully completed in TechTree
      const isAlreadyResearched = researchComponent.isResearched(researchType);
      if (isAlreadyResearched) continue;

      // Is this research currently the active (first) item being processed in this building?
      const isActiveInThisBuilding = researchComponent.currentResearchType === researchType;
      const progress = isActiveInThisBuilding ? researchComponent.getResearchProgress(researchType) : 0;

      // Is this research already queued anywhere (this or another building)?
      const isQueuedGlobally = this.isResearchTypeQueuedGlobally(researchType);

      // Validation state (resources, prerequisites) - only relevant when not yet queued
      const { disabled: isValidationDisabled, unmetRequirements } = this.getResearchValidationState(
        researchType,
        researchComponent
      );

      // Disable if already in queue globally or if validation fails
      // But keep it interactable (not disabled) if it's the active item - so the player can cancel
      const disabled = isQueuedGlobally || isValidationDisabled;

      action.setup({
        icon: {
          key: researchData.icon.key,
          frame: researchData.icon.frame,
          origin: { x: 0.5, y: 0.5 }
        },
        visible: true,
        disabled: disabled && !isActiveInThisBuilding,
        cooldownProgress: isActiveInThisBuilding ? progress : undefined,
        action: () => {
          if (isActiveInThisBuilding) {
            // Cancel the active research
            const playerNumber = getCurrentPlayerNumber(this.mainSceneWithActors);
            if (playerNumber && dispatchCancelResearchCommand(this.mainSceneWithActors, actor, playerNumber)) {
              this.audioService.playAudioSprite(AudioSprites.UI_FEEDBACK, UiFeedbackSfx.BUTTON_CLICK);
            }
          } else if (!disabled) {
            // Start/queue research
            const playerNumber = getCurrentPlayerNumber(this.mainSceneWithActors);
            const success =
              !!playerNumber &&
              dispatchResearchCommand(this.mainSceneWithActors, actor, playerNumber, researchType);
            if (success) {
              this.audioService.playAudioSprite(AudioSprites.UI_FEEDBACK, UiFeedbackSfx.BUTTON_CLICK);
            } else {
              this.audioService.playAudioSprite(AudioSprites.UI_FEEDBACK, UiFeedbackSfx.NOT_ENOUGH_RESOURCES);
            }
          } else {
            this.audioService.playAudioSprite(AudioSprites.UI_FEEDBACK, UiFeedbackSfx.NOT_ENOUGH_RESOURCES);
          }
        },
        tooltipInfo: {
          title: researchData.name + (isActiveInThisBuilding ? " (Click to cancel)" : ""),
          description: researchData.description,
          iconKey: researchData.icon.key,
          iconFrame: researchData.icon.frame,
          iconOrigin: { x: 0.5, y: 0.5 },
          unmetRequirements: unmetRequirements
        }
      } satisfies ActorActionSetup);
      index++;
    }

    return index;
  }

  /** Check if a research type is currently queued in any owned building's queue */
  private isResearchTypeQueuedGlobally(researchType: ResearchType): boolean {
    const playerNr = getCurrentPlayerNumber(this.mainSceneWithActors);
    if (!playerNr) return false;

    const actorIndex = getSceneService(this.mainSceneWithActors, ActorIndexSystem);
    if (!actorIndex) return false;

    const ownedActors = actorIndex.getOwnedActors(playerNr);

    for (const actor of ownedActors) {
      const sharedQueue = getActorComponent(actor, QueueComponent);
      if (sharedQueue) {
        const hasInQueue = sharedQueue.allItems.some(
          (item) => item.type === QueueItemType.Research && item.researchData === researchType
        );
        if (hasInQueue) return true;
      }
    }

    return false;
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

  private showDeleteIcon(
    actor: Phaser.GameObjects.GameObject,
    allActors: Phaser.GameObjects.GameObject[],
    index: number
  ): number {
    // Always show delete button as the last action (index 8, bottom-right position)
    const action = this.actor_actions[8];
    if (!action) {
      console.error("Action button not found at index 8");
      return index;
    }
    action.setup(this.deleteAction(actor, allActors));
    return index;
  }

  private hideAllIcons() {
    for (let i = 0; i < this.actor_actions.length; i++) {
      this.actor_actions[i]!.setup({ visible: false });
    }
  }

  /** Show buildable structures and categories when in building mode */
  private showBuildableIcons(
    actor: Phaser.GameObjects.GameObject,
    allActors: Phaser.GameObjects.GameObject[],
    index: number
  ): number {
    const builderComponent = getActorComponent(actor, BuilderComponent);
    if (!builderComponent) throw new Error("BuilderComponent not found");

    // Determine what to show based on navigation level
    const currentLevel = this.getCurrentConstructableLevel(builderComponent);

    // Show categories first
    const categories = currentLevel.constructableCategories || [];
    categories.forEach((category, localIndex) => {
      if (index >= this.actor_actions.length) {
        console.error("Not enough slots for category icons");
        return;
      }

      const action = this.actor_actions[index];
      if (!action) {
        console.error("Action button not found at index", index);
        return;
      }

      action.setup({
        icon: {
          key: category.key,
          frame: category.frame,
          origin: { x: 0.5, y: 0.5 }
        },
        visible: true,
        action: () => {
          // Navigate into this category
          this.categoryNavigationStack.push(category);
          this.refreshForCurrentSelection();
        },
        tooltipInfo: {
          title: category.text,
          description: `Browse ${category.text}`,
          iconKey: category.key,
          iconFrame: category.frame,
          iconOrigin: { x: 0.5, y: 0.5 }
        },
        shortcut: this.HOTKEYS[localIndex]
      });
      index++;
    });

    // Show buildings at current level
    const buildable = currentLevel.actorNames || [];
    buildable.forEach((building, localIndex) => {
      if (index >= this.actor_actions.length) {
        console.error("Not enough slots for building icons");
        return;
      }
      const actorDefinition = getPwActorDefinition(building, null);
      const info = actorDefinition?.components?.info;
      if (!info || !info.smallImage) {
        throw new Error(`Info component not found for ${building}`);
      }
      // UI validation gating
      const { disabled, validation } = this.getProductionValidationState(building);

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
            this.playInvalidActionSfx();
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
          description: info.description,
          definition: actorDefinition,
          unmetRequirements: validation?.prereqs
        },
        // Use letter shortcuts from handler (Q..O), offset by category count
        shortcut: this.HOTKEYS[categories.length + localIndex]
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
        // If we're in a category, go back one level
        if (this.categoryNavigationStack.length > 0) {
          this.categoryNavigationStack.pop();
          this.refreshForCurrentSelection();
        } else {
          // Otherwise exit building mode via handler
          this.playerActionsHandler.setBuildingMode(false);
        }
      },
      tooltipInfo: {
        title: this.categoryNavigationStack.length > 0 ? "Back" : "Stop Building",
        description: this.categoryNavigationStack.length > 0 ? "Go back to previous category" : "Stop building",
        iconKey: "gui",
        iconFrame: "action_icons/back.png",
        iconOrigin: { x: 0.5, y: 0.5 }
      },
      shortcut: "esc"
    });

    return index;
  }

  /** Get the constructable definition for the current navigation level */
  private getCurrentConstructableLevel(builderComponent: BuilderComponent): ConstructableDefinition {
    let current = builderComponent.constructableBuildingsNested;

    // Navigate down the stack to find current level
    for (const category of this.categoryNavigationStack) {
      const categories = current.constructableCategories || [];
      const found = categories.find(
        (c) => c.key === category.key && c.frame === category.frame && c.text === category.text
      );
      if (!found || !found.constructableDefinitions || found.constructableDefinitions.length === 0) {
        // Invalid navigation, reset
        console.warn("Invalid navigation, resetting stack");
        this.categoryNavigationStack = [];
        return builderComponent.constructableBuildingsNested;
      }
      // Merge all definitions in this category into a single ConstructableDefinition
      const mergedActorNames: ObjectNames[] = [];
      const mergedCategories: ConstructableCategory[] = [];

      found.constructableDefinitions.forEach((def) => {
        if (def.actorNames) {
          mergedActorNames.push(...def.actorNames);
        }
        if (def.constructableCategories) {
          mergedCategories.push(...def.constructableCategories);
        }
      });

      current = new ConstructableDefinition(
        mergedActorNames.length > 0 ? mergedActorNames : undefined,
        mergedCategories.length > 0 ? mergedCategories : undefined
      );
    }

    return current;
  }

  /** Check if an object can be produced/built, including tech tree and resource requirements */
  private getProductionValidationState(objectName: ObjectNames): {
    disabled: boolean;
    disabledDescription: string | null;
    validation: PreRequirement | null;
  } {
    const playerNumber = getCurrentPlayerNumber(this.mainSceneWithActors)!;
    const validation = ProductionValidator.validateObject(this.mainSceneWithActors, playerNumber, objectName);
    const disabled = !validation.canQueue;
    let disabledDescription: string | null = null;

    // Check for tech prerequisites (object and research requirements)
    const hasObjectPrereqs = validation.prereqs.objectNames.length > 0;
    const hasResearchPrereqs = validation.prereqs.researchTypes.length > 0;

    if (hasObjectPrereqs || hasResearchPrereqs) {
      const requirementObjectNames =
        validation.prereqs.objectNames?.map((req) => getPwActorDefinition(req, null)?.components?.info?.name ?? req) ??
        [];
      const requirementResearchNames =
        validation.prereqs.researchTypes?.map((req) => researchDefinitions[req]?.name ?? req) ?? [];
      const requirementNames = [...requirementObjectNames, ...requirementResearchNames].join(", ");
      disabledDescription = `Requires: ${requirementNames}`;
    }

    // Check for resource requirements
    const hasResourcePrereqs = Object.keys(validation.prereqs.resources).length > 0;
    if (hasResourcePrereqs && !disabledDescription) {
      disabledDescription = "Not enough resources";
    }

    // Check for supply requirements
    if (validation.prereqs.supply !== null && validation.prereqs.supply > 0 && !disabledDescription) {
      disabledDescription = `Need ${validation.prereqs.supply} more supply`;
    }

    return { disabled, disabledDescription, validation };
  }

  /** Subscribe to the selected actor's spell cooldown events and drive a refresh timer */
  private subscribeToSpellCooldowns(actor: Phaser.GameObjects.GameObject) {
    this.spellCooldownSubscriptions.forEach((sub) => sub.unsubscribe());
    this.spellCooldownSubscriptions = [];
    this.stopSpellCooldownTimer();

    const spellComponent = getActorComponent(actor, SpellComponent);
    if (!spellComponent) return;

    // Start the timer when a cooldown begins
    const startedSub = spellComponent.spellCooldownStarted.subscribe(() => {
      this.startSpellCooldownTimer(spellComponent);
    });
    this.spellCooldownSubscriptions.push(startedSub);

    // Stop the timer when the last cooldown expires
    const endedSub = spellComponent.spellCooldownEnded.subscribe(() => {
      const stillActive = spellComponent.availableSpells.some((s) => spellComponent.getCooldownRemaining(s) > 0);
      if (!stillActive) {
        this.stopSpellCooldownTimer();
        // Final refresh to clear the cooldown overlays
        this.refreshForCurrentSelection();
      }
    });
    this.spellCooldownSubscriptions.push(endedSub);

    // If there are already active cooldowns when the actor is selected, start timer immediately
    const hasActiveCooldowns = spellComponent.availableSpells.some((s) => spellComponent.getCooldownRemaining(s) > 0);
    if (hasActiveCooldowns) {
      this.startSpellCooldownTimer(spellComponent);
    }
  }

  private startSpellCooldownTimer(spellComponent: SpellComponent) {
    if (this.spellUpdateTimer) return; // Already running

    this.spellUpdateTimer = this.mainSceneWithActors.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        // Stop if no more active cooldowns
        const stillActive = spellComponent?.availableSpells.some((s) => spellComponent.getCooldownRemaining(s) > 0);
        if (!stillActive) {
          this.stopSpellCooldownTimer();
          this.refreshForCurrentSelection();
          return;
        }
        this.refreshForCurrentSelection();
      }
    });
  }

  private stopSpellCooldownTimer() {
    this.spellUpdateTimer?.remove(false);
    this.spellUpdateTimer = undefined;
  }

  /** Check if a spell can be cast (cooldown, mana, research requirements) */
  private getSpellValidationState(
    spellType: SpellType,
    spellComponent: SpellComponent
  ): {
    disabled: boolean;
    disabledDescription: string | null;
    unmetRequirements: PreRequirementType;
  } {
    const spellData = spellDefinitions[spellType];
    const isResearched = spellComponent.isSpellResearched(spellType);
    const canCast = spellComponent.canCastSpell(spellType);

    const disabled = !isResearched || !canCast;
    let disabledDescription: string | null = null;
    const unmetRequirements: PreRequirementType = {
      objectNames: [],
      researchTypes: [],
      resources: {},
      supply: null
    };

    if (!isResearched && spellData.requiresResearch) {
      const researchData = researchDefinitions[spellData.requiresResearch];
      const researchName = researchData?.name ?? spellData.requiresResearch;
      disabledDescription = `Requires: ${researchName}`;
      unmetRequirements.researchTypes = [spellData.requiresResearch];
    }

    return { disabled, disabledDescription, unmetRequirements };
  }

  /** Check if research can be started (resources, prerequisites) */
  private getResearchValidationState(
    researchType: ResearchType,
    researchComponent: ResearchComponent
  ): {
    disabled: boolean;
    disabledDescription: string | null;
    unmetRequirements: PreRequirementType;
  } {
    const researchData = researchDefinitions[researchType];
    const isAlreadyResearched = researchComponent.isResearched(researchType);
    const isCurrentlyResearching = researchComponent.currentResearchType === researchType;
    const { canStart, reason } = researchComponent.canStartResearch(researchType);

    const currentPlayerNr = getCurrentPlayerNumber(this.mainSceneWithActors);
    const player = getPlayer(this.mainSceneWithActors, currentPlayerNr);
    const canAfford = player?.canPayAllResources(researchData.cost) ?? false;

    const disabled = !canStart && !isCurrentlyResearching;
    let disabledDescription: string | null = null;
    const unmetRequirements = {
      objectNames: [],
      researchTypes: [],
      resources: {},
      supply: null
    } satisfies PreRequirementType;

    if (!canAfford && !isCurrentlyResearching) {
      disabledDescription = "Not enough resources";
    } else if (reason) {
      disabledDescription = reason;
      // If there are prerequisite research items, add them to unmet requirements
      // Note: This assumes the reason contains info about missing prerequisites
      // You may need to extend ResearchComponent to expose prerequisite info
    }

    return { disabled, disabledDescription, unmetRequirements };
  }

  private playInvalidActionSfx() {
    this.audioService.playAudioSprite(AudioSprites.UI_FEEDBACK, UiFeedbackSfx.BUILD_DENIED);
  }

  override destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.selectionChangedSubscription?.unsubscribe();
    this.actorKillSubscription?.unsubscribe();
    this.actorConstructionSubscription?.unsubscribe();
    this.buildingModeSubscription?.unsubscribe();
    this.resourceChangedSubscription?.unsubscribe();
    this.actorUnlockSubscription?.unsubscribe();
    this.researchEventSubscriptions.forEach((sub) => sub.unsubscribe());
    this.spellCooldownSubscriptions.forEach((sub) => sub.unsubscribe());
    this.stopSpellCooldownTimer();
    this.categoryNavigationStack = [];
    this.tabHandlerSubscription?.unsubscribe();
    this.mainSceneWithActors.events.off(
      PlayerActionsHandler.BUILDING_MODE_SHORTCUT_PRESSED,
      this.onBuildModeKeyDown,
      this
    );
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
