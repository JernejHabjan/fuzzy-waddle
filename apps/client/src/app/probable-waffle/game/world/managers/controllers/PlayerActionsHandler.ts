import { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { OrderType } from "../../../entity/character/ai/order-type";
import { CursorHandler, CursorType } from "./input/cursor.handler";
import { getSceneComponent } from "../../../scenes/components/scene-component-helpers";
import { Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import { emitEventIssueActorCommandToSelectedActors, listenToSelectionEvents } from "../../../data/scene-data";
import { SingleSelectionHandler } from "./input/single-selection.handler";
import { BehaviorSubject, Subscription } from "rxjs";
import { getPrimarySelectedActor } from "../../../data/selection-helpers";
import { getActorComponent } from "../../../data/actor-component";
import { PawnAiController } from "./player-pawn-ai-controller/pawn-ai-controller";
import { BuilderComponent } from "../../../entity/actor/components/builder-component";
import { BuildingCursor } from "../../../world/managers/controllers/building-cursor";
import { ProductionComponent } from "../../../entity/building/production/production-component";
import { pwActorDefinitions } from "../../../data/actor-definitions";
import GameObject = Phaser.GameObjects.GameObject;

export class PlayerActionsHandler {
  private handlingActions?: {
    orderType: OrderType;
  };

  private selectionChangedSubscription?: Subscription;
  private currentSelectedActors: GameObject[] = [];
  private primarySelectedActor?: GameObject;
  buildingModeActive: boolean = false;

  // Letter hotkeys for lists (production/buildings)
  private readonly HOTKEYS: string[] = ["q", "w", "e", "r", "t", "y", "u", "i", "o"];

  // Broadcast build mode changes to HUD/UI
  private readonly buildingModeSubject = new BehaviorSubject<boolean>(false);
  public readonly buildingMode$ = this.buildingModeSubject.asObservable();

  constructor(
    private readonly scene: ProbableWaffleScene,
    private readonly hudScene: ProbableWaffleScene
  ) {
    this.bindSceneInput();
    this.scene.onShutdown.subscribe(() => this.destroy());
  }

  private bindSceneInput() {
    this.scene.input.on(Phaser.Input.Events.POINTER_UP, this.pointerHandler, this);

    // Listen to selection changes to track primary selection deterministically
    this.selectionChangedSubscription = listenToSelectionEvents(this.scene)?.subscribe(() => {
      const { selectedActors, actorsByPriority, primaryActor } = getPrimarySelectedActor(this.scene);
      this.currentSelectedActors = actorsByPriority.length ? actorsByPriority : selectedActors;
      this.primarySelectedActor = primaryActor;
      // reset on selection change
      this.setBuildingMode(false);
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
    const code = e.code;
    if (!code) return;

    // Handle list hotkeys using KeyboardEvent.code
    const listIndex = this.HOTKEYS.findIndex((h) => this.mapKeyToCode(h) === code);
    if (listIndex !== -1) {
      if (this.buildingModeActive) {
        // Building selection
        const actor = this.primarySelectedActor;
        const builder = actor ? getActorComponent(actor, BuilderComponent) : undefined;
        const building = builder?.constructableBuildings[listIndex];
        if (building) {
          const buildingCursor = getSceneComponent(this.scene, BuildingCursor);
          buildingCursor?.startPlacingBuilding.emit(building);
          e.preventDefault();
          return;
        }
      } else {
        // Production selection
        const actor = this.primarySelectedActor;
        const production = actor ? getActorComponent(actor, ProductionComponent) : undefined;
        const product = production?.productionDefinition.availableProduceActors[listIndex];
        if (production && production.isFinished && product) {
          const def = pwActorDefinitions[product];
          const cost = def.components?.productionCost;
          if (cost) {
            production.startProduction({ actorName: product, costData: cost });
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
        this.currentSelectedActors.forEach((actor) => {
          const pawnAiController = getActorComponent(actor, PawnAiController);
          pawnAiController?.blackboard.resetCurrentOrder();
        });
        this.stopOrderCommand();
        e.preventDefault();
        break;
      case "KeyB":
        // Toggle building mode
        this.setBuildingMode(!this.buildingModeActive);
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

  private pointerHandler(pointer: Phaser.Input.Pointer, gameObjectsUnderCursor: GameObject[]) {
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

    const objectId = interactiveObjectIds.length > 0 ? interactiveObjectIds[0] : undefined;

    this.initiateCommand(clickedTileXY, objectId);

    // reset handling actions after all macro events are handled (all other pointer up events)
    setTimeout(() => {
      this.handlingActions = undefined;
    }, 0);
  }

  private destroy() {
    this.scene.input.off(Phaser.Input.Events.POINTER_UP, this.pointerHandler, this);
    this.hudScene.input.keyboard?.off("keydown", this.onKeyDown, this);
    this.selectionChangedSubscription?.unsubscribe();
  }

  isHandlingActions(): boolean {
    return !!this.handlingActions;
  }

  startOrderCommand(orderType: OrderType, actors: GameObject[]) {
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

  private initiateCommand(tileVec2?: Vector2Simple, targetGameObjectId?: string) {
    if (!this.handlingActions) return;
    const { orderType } = this.handlingActions;

    const tileVec3 = tileVec2
      ? {
          x: tileVec2.x,
          y: tileVec2.y,
          z: 0
        }
      : undefined;

    emitEventIssueActorCommandToSelectedActors(this.scene, {
      orderType,
      objectIds: targetGameObjectId ? [targetGameObjectId] : undefined,
      tileVec3
    });
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
