import { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { OrderType } from "../../ai/order-type";
import { CursorHandler, CursorType } from "./cursor.handler";
import { getSceneComponent, getSceneService } from "../../world/services/scene-component-helpers";
import { type Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { canActorTraverseTile } from "../../data/game-object-helper";
import {
  getCurrentPlayerNumber,
  listenToSelectionEvents
} from "../../data/scene-data";
import { SingleSelectionHandler } from "./single-selection.handler";
import { BehaviorSubject, Subscription } from "rxjs";
import { getPrimarySelectedActor } from "../../data/selection-helpers";
import { getActorComponent } from "../../data/actor-component";
import { PawnAiController } from "../../prefabs/ai-agents/pawn-ai-controller";
import { BuilderComponent } from "../../entity/components/construction/builder-component";
import { BuildingCursor } from "./building-cursor";
import { ProductionComponent } from "../../entity/components/production/production-component";
import { getPwActorDefinition } from "../../prefabs/definitions/actor-definitions";
import { AttackComponent } from "../../entity/components/combat/components/attack-component";
import { ActorTranslateComponent } from "../../entity/components/movement/actor-translate-component";
import { GathererComponent } from "../../entity/components/resource/gatherer-component";
import { HealingComponent } from "../../entity/components/combat/components/healing-component";
import { HealthComponent } from "../../entity/components/combat/components/health-component";
import HudProbableWaffle from "../../world/scenes/hud-scenes/HudProbableWaffle";
import { OwnerComponent } from "../../entity/components/owner-component";
import { findProductionBuildingWithLeastRemainingTime } from "../../entity/components/production/production-helpers";
import { IdComponent } from "../../entity/components/id-component";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { NavigationService } from "../../world/services/navigation.service";
import { dispatchProductionCommand } from "../../data/commands/queue-command-dispatch";
import GameObject = Phaser.GameObjects.GameObject;

export class PlayerActionsHandler {
  public static BUILDING_MODE_SHORTCUT_PRESSED = "hotkey-build-list-selection";
  private handlingActions?: {
    orderType: OrderType;
  };

  private selectionChangedSubscription?: Subscription;
  private currentSelectedActors: GameObject[] = [];
  private primarySelectedActor?: GameObject;
  buildingModeActive: boolean = false;
  private externalModalOpen = false;
  private shiftKey?: Phaser.Input.Keyboard.Key;

  // Letter hotkeys for lists (production/buildings)
  private readonly HOTKEYS: string[] = ["q", "w", "e", "r", "t", "y", "u", "i", "o"];

  // Broadcast build mode changes to HUD/UI
  private readonly buildingModeSubject = new BehaviorSubject<boolean>(false);
  public readonly buildingModeObservable = this.buildingModeSubject.asObservable();
  private externalModalSubscription?: Subscription;

  constructor(
    private readonly scene: ProbableWaffleScene,
    private readonly hudScene: ProbableWaffleScene
  ) {
    this.bindSceneInput();
    this.scene.onShutdown.subscribe(() => this.destroy());
  }

  private bindSceneInput() {
    this.shiftKey = this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.scene.input.on(Phaser.Input.Events.POINTER_UP, this.pointerHandler, this);

    // Listen to selection changes to track primary selection deterministically
    this.selectionChangedSubscription = listenToSelectionEvents(this.scene)?.subscribe(() => {
      // wait so that any tab changes are processed first
      setTimeout(() => {
        const { selectedActors, primaryActor } = getPrimarySelectedActor(this.scene);
        this.currentSelectedActors = selectedActors;
        this.primarySelectedActor = primaryActor;
        // reset on selection change
        this.setBuildingMode(false);
      }, 0);
    });

    // Listen to chat modal state changes
    this.externalModalSubscription = this.scene.communicator.allScenes.subscribe((event) => {
      if (event.name === "external-modal-opened") {
        this.externalModalOpen = true;
      } else if (event.name === "external-modal-closed") {
        this.externalModalOpen = false;
      }
    });

    // Global keyboard shortcuts
    this.hudScene.input.keyboard?.on("keydown", this.onKeyDown, this);
  }

  // External API for HUD to toggle build mode
  public setBuildingMode(active: boolean) {
    this.buildingModeActive = active;
    this.buildingModeSubject.next(active);
    if (!active) {
      const buildingCursor = getSceneComponent(this.scene, BuildingCursor);
      buildingCursor?.stopPlacingBuilding.emit();
    }
  }

  // Allow UI to reuse the same list of hotkeys
  public getListHotkeys(): readonly string[] {
    return this.HOTKEYS;
  }

  // Translate display hotkey (e.g., "q") to KeyboardEvent.code (e.g., "KeyQ")
  private mapKeyToCode(k: string): string {
    return k.length === 1 ? `Key${k.toUpperCase()}` : k;
  }

  private onKeyDown(e: KeyboardEvent) {
    // Don't process keyboard events if chat modal is open
    if (this.externalModalOpen) return;
    if (this.scene.isSpectator || this.scene.baseGameData.gameInstance.gameInstanceMetadata.isReplay()) return;

    const code = e.code;
    if (!code) return;

    // Handle list hotkeys using KeyboardEvent.code
    const listIndex = this.HOTKEYS.findIndex((h) => this.mapKeyToCode(h) === code);
    if (listIndex !== -1) {
      if (this.buildingModeActive) {
        // In build mode, don't handle here - let ActorActions handle it via button emission
        this.scene.events.emit(PlayerActionsHandler.BUILDING_MODE_SHORTCUT_PRESSED, listIndex);
        e.preventDefault();
        return;
      } else {
        // Production selection
        const actor = this.primarySelectedActor;
        const production = actor ? getActorComponent(actor, ProductionComponent) : undefined;
        const product = production?.productionDefinition.availableProduceActors[listIndex];
        if (production && production.isFinished && product) {
          // Find the production building with the least total remaining production time
          const targetComponent = findProductionBuildingWithLeastRemainingTime(this.currentSelectedActors);
          const playerNumber = getCurrentPlayerNumber(this.scene);
          if (targetComponent && playerNumber) {
            dispatchProductionCommand(this.scene, this.currentSelectedActors, playerNumber, product);
            e.preventDefault();
            return;
          }
        }
      }
      // fall through if not handled
    }

    switch (code) {
      case "KeyA":
        if (this.currentSelectedActors.length) this.startOrderCommand(OrderType.Attack, this.currentSelectedActors);
        e.preventDefault();
        break;
      case "KeyM":
        if (this.currentSelectedActors.length) this.startOrderCommand(OrderType.Move, this.currentSelectedActors);
        e.preventDefault();
        break;
      case "KeyV":
        if (this.currentSelectedActors.length) {
          // if production component, then place rally point
          const primary = this.primarySelectedActor;
          const hasProduction = !!(primary && getActorComponent(primary, ProductionComponent));
          if (hasProduction) {
            // Start a two-step Move command; ProductionComponent listens for move to set rally point
            this.startOrderCommand(OrderType.Move, this.currentSelectedActors);
          }
        }
        e.preventDefault();
        break;
      case "KeyG":
        if (this.currentSelectedActors.length) this.startOrderCommand(OrderType.Gather, this.currentSelectedActors);
        e.preventDefault();
        break;
      case "KeyH":
        if (this.currentSelectedActors.length) this.startOrderCommand(OrderType.Heal, this.currentSelectedActors);
        e.preventDefault();
        break;
      case "KeyS":
        // Stop current orders immediately
        if (this.currentSelectedActors.length) {
          const stopPlayerNumber = getCurrentPlayerNumber(this.scene);
          const stopActorIds = this.currentSelectedActors
            .map((a) => getActorComponent(a, IdComponent)?.id)
            .filter((id): id is string => !!id);
          if (stopPlayerNumber && stopActorIds.length) {
            const commandBus = getSceneService(this.scene, CommandBusService);
            commandBus?.dispatch({ type: "STOP", playerNumber: stopPlayerNumber, actorIds: stopActorIds });
          }
        }
        this.stopOrderCommand();
        e.preventDefault();
        break;
      case "KeyB":
        // Toggle building mode
        if (this.buildingModeActive) {
          this.setBuildingMode(false);
        } else {
          // build mode can only be entered if primary selection has builder component
          const actor = this.primarySelectedActor;
          const hasBuilder = !!(actor && getActorComponent(actor, BuilderComponent));
          if (hasBuilder) {
            this.setBuildingMode(true);
          }
        }
        e.preventDefault();
        break;
      case "Delete":
        // Delete selected actors
        this.deleteSelectedActors();
        e.preventDefault();
        break;
      case "Escape":
        // Cancel current cursor/orders and building placement
        this.stopOrderCommand();
        this.setBuildingMode(false);
        e.preventDefault();
        break;
      default:
        break;
    }
  }

  private async deleteSelectedActors() {
    if (this.scene.isSpectator || this.scene.baseGameData.gameInstance.gameInstanceMetadata.isReplay()) return;

    const currentPlayerNumber = getCurrentPlayerNumber(this.scene);
    if (!currentPlayerNumber) return;

    const owningSelectedActors = this.currentSelectedActors.filter((actor) => {
      const ownerComponent = getActorComponent(actor, OwnerComponent);
      return ownerComponent?.getOwner() === currentPlayerNumber;
    });

    // check if any of them in this.currentSelectedActors is a main building
    const anyIsMainBuilding = owningSelectedActors.some((actor) => {
      const actorDefinition = getPwActorDefinition(actor.name, null);
      return actorDefinition?.meta?.isMainBuilding ?? false;
    });

    if (anyIsMainBuilding) {
      const hudScene = this.hudScene as HudProbableWaffle;
      const confirmed = await hudScene.confirmationDialog.show(
        "Are you sure you want to delete this main building? This action cannot be undone."
      );
      if (!confirmed) {
        return;
      }
    }

    // Delete all selected actors
    owningSelectedActors.forEach((actor) => {
      const healthComponent = getActorComponent(actor, HealthComponent);
      if (!healthComponent) return;
      if (!healthComponent.canDamageOrKillOnOwnerAction()) return;
      healthComponent.killActor();
    });
  }

  private pointerHandler(pointer: Phaser.Input.Pointer, gameObjectsUnderCursor: GameObject[]) {
    if (this.scene.isSpectator || this.scene.baseGameData.gameInstance.gameInstanceMetadata.isReplay()) return;
    if (!this.handlingActions) return;

    const cursorHandler = getSceneComponent(this.hudScene, CursorHandler);
    if (cursorHandler) {
      cursorHandler.setCursor(CursorType.Default);
    }

    const { clickedTileXY, interactiveObjectIds } = SingleSelectionHandler.getTileAndGameObjectsOnPointerClick(
      this.scene,
      pointer,
      gameObjectsUnderCursor
    );
    const clickedWorldVec2 = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);

    const objectId = interactiveObjectIds.length > 0 ? interactiveObjectIds[0] : undefined;

    this.initiateCommand(clickedTileXY, clickedWorldVec2, objectId);

    // reset handling actions after all macro events are handled (all other pointer up events)
    setTimeout(() => {
      this.handlingActions = undefined;
    }, 0);
  }

  private destroy() {
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.pointerHandler, this);
    this.hudScene.input.keyboard?.off("keydown", this.onKeyDown, this);
    this.selectionChangedSubscription?.unsubscribe();
    this.externalModalSubscription?.unsubscribe();
    this.shiftKey?.destroy();
  }

  isHandlingActions(): boolean {
    return !!this.handlingActions;
  }

  // Check whether any of the provided actors can perform the requested order
  private selectionSupportsOrder(orderType: OrderType, actors: GameObject[]): boolean {
    return actors.some((actor) => {
      switch (orderType) {
        case OrderType.Attack:
          return !!getActorComponent(actor, AttackComponent);
        case OrderType.Move:
          return !!getActorComponent(actor, ActorTranslateComponent) || !!getActorComponent(actor, ProductionComponent);
        case OrderType.EnterContainer:
          return !!getActorComponent(actor, ActorTranslateComponent);
        case OrderType.Gather:
        case OrderType.ReturnResources:
          return !!getActorComponent(actor, GathererComponent);
        case OrderType.Heal:
          return !!getActorComponent(actor, HealingComponent);
        case OrderType.Repair:
        case OrderType.Build:
          return !!getActorComponent(actor, BuilderComponent);
        case OrderType.Stop:
        default:
          // Stop and unknown types don't need capability gating here
          return true;
      }
    });
  }

  startOrderCommand(orderType: OrderType, actors: GameObject[]) {
    if (this.scene.isSpectator || this.scene.baseGameData.gameInstance.gameInstanceMetadata.isReplay()) {
      return;
    }

    // Only start the order if at least one actor supports it
    if (!this.selectionSupportsOrder(orderType, actors)) {
      // silently ignore if no capable actor is selected
      return;
    }

    this.handlingActions = {
      orderType
    };
    const cursorHandler = getSceneComponent(this.hudScene, CursorHandler);
    if (!cursorHandler) {
      console.warn("CursorHandler not found in scene components");
      return;
    }
    let cursorType: CursorType;
    switch (orderType) {
      case OrderType.Attack:
        cursorType = CursorType.AttackGreen;
        break;
      case OrderType.Gather:
        cursorType = CursorType.ChopGreen;
        break;
      case OrderType.Move:
        cursorType = CursorType.TargetMoveA;
        break;
      case OrderType.ReturnResources:
        cursorType = CursorType.ChopGreen;
        break;
      case OrderType.Repair:
        cursorType = CursorType.BuildGreen;
        break;
      case OrderType.Heal:
        cursorType = CursorType.PotionGreen;
        break;
      case OrderType.EnterContainer:
        cursorType = CursorType.TargetMoveB;
        break;
      case OrderType.Build:
      case OrderType.Stop:
      default:
        // There is no need for a specific cursor type for these actions as they're not two-step actions
        cursorType = CursorType.Default;
        break;
    }
    cursorHandler.setCursor(cursorType);
  }

  private initiateCommand(
    clickedTileXY?: Vector2Simple,
    clickedWorldVec2?: Vector2Simple,
    targetGameObjectId?: string
  ) {
    if (!this.handlingActions) return;
    const { orderType } = this.handlingActions;

    const tileVec3 = clickedTileXY
      ? {
          x: clickedTileXY.x,
          y: clickedTileXY.y,
          z: 0
        }
      : undefined;
    const worldVec3 = clickedWorldVec2
      ? {
          x: clickedWorldVec2.x,
          y: clickedWorldVec2.y,
          z: 0
        }
      : undefined;

    const playerNumber = getCurrentPlayerNumber(this.scene);
    if (!playerNumber) return;

    // Capture shift state at dispatch time so all clients apply the same queue/override decision
    const queue = this.shiftKey?.isDown ?? false;

    const actorIds = this.currentSelectedActors
      .map((a) => getActorComponent(a, IdComponent)?.id)
      .filter((id): id is string => !!id);
    if (!actorIds.length) return;

    const commandBus = getSceneService(this.scene, CommandBusService);
    if (!commandBus) return;

    const hasProductionRallyPointOrder =
      orderType === OrderType.Move &&
      this.primarySelectedActor &&
      getActorComponent(this.primarySelectedActor, ProductionComponent);
    if (hasProductionRallyPointOrder && !!tileVec3 && !!worldVec3) {
      commandBus.dispatch({ type: "MOVE", playerNumber, actorIds, tileVec3, worldVec3, queue });
    } else {
      // Validate terrain compatibility before issuing Move commands
      if (orderType === OrderType.Move && tileVec3 && !targetGameObjectId) {
        if (this.isTerrainInvalidForSelectedActors(tileVec3)) {
          const cursorHandler = getSceneComponent(this.hudScene, CursorHandler);
          if (cursorHandler) {
            cursorHandler.setCursor(CursorType.Impossible);
            setTimeout(() => cursorHandler.setCursor(CursorType.Default), 400);
          }
          return;
        }
      }
      commandBus.dispatch({
        type: "ACTOR_ACTION",
        playerNumber,
        actorIds,
        orderType,
        targetObjectIds: targetGameObjectId ? [targetGameObjectId] : undefined,
        tileVec3,
        queue
      });
    }
  }

  /**
   * Returns true if ALL selected movable actors are terrain-incompatible with the target tile.
   * Mixed selections (e.g., ground + water unit) are allowed — each unit will pathfind individually.
   */
  private isTerrainInvalidForSelectedActors(tileVec3: { x: number; y: number }): boolean {
    const navigationService = getSceneService(this.scene, NavigationService);
    if (!navigationService) return false;

    const movableActors = this.currentSelectedActors.filter((a) => !!getActorComponent(a, ActorTranslateComponent));
    if (movableActors.length === 0) return false;

    return movableActors.every((actor) => !canActorTraverseTile(actor, navigationService, tileVec3));
  }

  stopOrderCommand() {
    this.handlingActions = undefined;
    const cursorHandler = getSceneComponent(this.hudScene, CursorHandler);
    if (cursorHandler) {
      cursorHandler.setCursor(CursorType.Default);
    }
  }

  getCurrentOrderType() {
    return this.handlingActions?.orderType;
  }
}
