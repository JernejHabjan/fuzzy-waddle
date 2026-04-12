import { LockedCursorHandler } from "./locked-cursor.handler";
import { Input } from "phaser";
import { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { getActorComponent } from "../../data/actor-component";
import { OwnerComponent } from "../../entity/components/owner-component";
import { ResourceSourceComponent } from "../../entity/components/resource/resource-source-component";
import { AttackComponent } from "../../entity/components/combat/components/attack-component";
import { HealingComponent } from "../../entity/components/combat/components/healing-component";
import { BuilderComponent } from "../../entity/components/construction/builder-component";
import { ConstructionSiteComponent } from "../../entity/components/construction/construction-site-component";
import { ContainerComponent } from "../../entity/components/building/container-component";
import { getCurrentPlayerNumber, getSelectedActors } from "../../data/scene-data";
import { canActorTraverseTile, getSelectableGameObject } from "../../data/game-object-helper";
import { getSceneComponent, getSceneService } from "../../world/services/scene-component-helpers";
import { PlayerActionsHandler } from "./player-actions-handler";
import { BuildingCursor } from "./building-cursor";
import { MULTI_SELECTING } from "./multi-selection.handler";
import { OrderType } from "../../ai/order-type";
import { GameSettings } from "../../core/gameSettings";
import { ContainableComponent } from "../../entity/components/building/containable-component";
import { GathererComponent } from "../../entity/components/resource/gatherer-component";
import GameObject = Phaser.GameObjects.GameObject;
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { NavigationService } from "../../world/services/navigation.service";
import { IsoHelper } from "../../world/tilemap/iso-helper";
import { ActorTranslateComponent } from "../../entity/components/movement/actor-translate-component";

export enum CursorType {
  Add = "add",
  AttackEnemy = "attackEnemy",
  AttackFriends = "attackFriends",
  AttackGreen = "attackGreen",
  AttackRed = "attackRed",
  AttackYellow = "attackYellow",
  BuildGreen = "buildGreen",
  BuildRed = "buildRed",
  CannotTarget = "cannotTarget",
  CannotUse = "cannotUse",
  ChopGreen = "chopGreen",
  ChopRed = "chopRed",
  DefaultEnemy = "defaultEnemy",
  DefaultFriends = "defaultFriends",
  Default = "default",
  Impossible = "impossible",
  MagicUseBlue = "magicUseBlue",
  MagicUseGreen = "magicUseGreen",
  MagicUseRed = "magicUseRed",
  MagicUseViolet = "magicUseViolet",
  MiniAttackGreen1 = "miniAttackGreen1",
  MiniAttackGreen = "miniAttackGreen",
  MiniAttackRed1 = "miniAttackRed1",
  MiniAttackRed = "miniAttackRed",
  MiniAttackYellow = "miniAttackYellow",
  MiniBuildGreen = "miniBuildGreen",
  MiniBuildRed = "miniBuildRed",
  MiniCannot = "miniCannot",
  MiniChopGreen = "miniChopGreen",
  MiniChopRed = "miniChopRed",
  MiniDefaultAdd = "miniDefaultAdd",
  MiniDefaultSubtract = "miniDefaultSubtract",
  MiniEatFood = "miniEatFood",
  MiniImpossible = "miniImpossible",
  MiniMoveDown = "miniMoveDown",
  MiniMoveLeft = "miniMoveLeft",
  MiniMoveRight = "miniMoveRight",
  MiniMoveUp = "miniMoveUp",
  MiniPickaxeGreen = "miniPickaxeGreen",
  MiniPickaxeRed = "miniPickaxeRed",
  MiniPossible = "miniPossible",
  MiniPotionBlue = "miniPotionBlue",
  MiniPotionGreen = "miniPotionGreen",
  MiniPotionPurple = "miniPotionPurple",
  MiniPotionRed = "miniPotionRed",
  MiniQuestionGreen = "miniQuestionGreen",
  MiniQuestionYellow = "miniQuestionYellow",
  MiniScytheGreen = "miniScytheGreen",
  MiniScytheRed = "miniScytheRed",
  MiniSettingsGreen = "miniSettingsGreen",
  MiniSettingsRed = "miniSettingsRed",
  MiniSettingsYellow = "miniSettingsYellow",
  MiniShieldGreen = "miniShieldGreen",
  MiniShieldRed = "miniShieldRed",
  MoveDown = "moveDown",
  MoveLeft = "moveLeft",
  MoveRight = "moveRight",
  MoveUp = "moveUp",
  PickaxeGreen = "pickaxeGreen",
  PickaxeRed = "pickaxeRed",
  Possible = "possible",
  PotionBlue = "potionBlue",
  PotionGreen = "potionGreen",
  PotionPurple = "potionPurple",
  PotionRed = "potionRed",
  QuestionGreen = "questionGreen",
  QuestionYellow = "questionYellow",
  ScytheGreen = "scytheGreen",
  ScytheRed = "scytheRed",
  SettingsGreen = "settingsGreen",
  SettingsRed = "settingsRed",
  SettingsYellow = "settingsYellow",
  ShieldGreen = "shieldGreen",
  ShieldRed = "shieldRed",
  Subtract = "subtract",
  TargetMoveA = "targetMoveA",
  TargetMoveB = "targetMoveB"
}

export class CursorHandler {
  // noinspection SpellCheckingInspection
  readonly cursors: Record<CursorType, string> = {
    [CursorType.Add]: "Cursor Add",
    [CursorType.AttackEnemy]: "Cursor Attack Enemy",
    [CursorType.AttackFriends]: "Cursor Attack Friends",
    [CursorType.AttackGreen]: "Cursor Attack Green",
    [CursorType.AttackRed]: "Cursor Attack Red",
    [CursorType.AttackYellow]: "Cursor Attack Yellow",
    [CursorType.BuildGreen]: "Cursor Build Green",
    [CursorType.BuildRed]: "Cursor Build Red",
    [CursorType.CannotTarget]: "Cursor Cannot Target",
    [CursorType.CannotUse]: "Cursor Cannot Use",
    [CursorType.ChopGreen]: "Cursor Chop Green",
    [CursorType.ChopRed]: "Cursor Chop Red",
    [CursorType.DefaultEnemy]: "Cursor Default Enemy",
    [CursorType.DefaultFriends]: "Cursor Default Friends",
    [CursorType.Default]: "Cursor Default",
    [CursorType.Impossible]: "Cursor impossible",
    [CursorType.MagicUseBlue]: "Cursor Magic Use Blue",
    [CursorType.MagicUseGreen]: "Cursor Magic Use Green",
    [CursorType.MagicUseRed]: "Cursor Magic Use Red",
    [CursorType.MagicUseViolet]: "Cursor Magic Use Violet",
    [CursorType.MiniAttackGreen1]: "Cursor Mini Attack Green-1",
    [CursorType.MiniAttackGreen]: "Cursor Mini Attack Green",
    [CursorType.MiniAttackRed1]: "Cursor Mini Attack Red-1",
    [CursorType.MiniAttackRed]: "Cursor Mini Attack Red",
    [CursorType.MiniAttackYellow]: "Cursor Mini Attack Yellow",
    [CursorType.MiniBuildGreen]: "Cursor Mini Build Green",
    [CursorType.MiniBuildRed]: "Cursor Mini Build Red",
    [CursorType.MiniCannot]: "Cursor Mini Cannot",
    [CursorType.MiniChopGreen]: "Cursor Mini Chop Green",
    [CursorType.MiniChopRed]: "Cursor Mini Chop Red",
    [CursorType.MiniDefaultAdd]: "Cursor Mini Default Add",
    [CursorType.MiniDefaultSubtract]: "Cursor Mini Default Substract",
    [CursorType.MiniEatFood]: "Cursor Mini Eat Food",
    [CursorType.MiniImpossible]: "Cursor Mini Impossible",
    [CursorType.MiniMoveDown]: "Cursor Mini Move Down",
    [CursorType.MiniMoveLeft]: "Cursor Mini Move Left",
    [CursorType.MiniMoveRight]: "Cursor Mini Move Right",
    [CursorType.MiniMoveUp]: "Cursor Mini Move Up",
    [CursorType.MiniPickaxeGreen]: "Cursor Mini Pickaxe Green",
    [CursorType.MiniPickaxeRed]: "Cursor Mini Pickaxe Red",
    [CursorType.MiniPossible]: "Cursor Mini Possible",
    [CursorType.MiniPotionBlue]: "Cursor Mini Potion Blue",
    [CursorType.MiniPotionGreen]: "Cursor Mini Potion Green",
    [CursorType.MiniPotionPurple]: "Cursor Mini Potion Purple",
    [CursorType.MiniPotionRed]: "Cursor Mini Potion Red",
    [CursorType.MiniQuestionGreen]: "Cursor Mini Question Green",
    [CursorType.MiniQuestionYellow]: "Cursor Mini Question Yellow",
    [CursorType.MiniScytheGreen]: "Cursor Mini Scythe Green",
    [CursorType.MiniScytheRed]: "Cursor Mini Scythe Red",
    [CursorType.MiniSettingsGreen]: "Cursor Mini Settings Green",
    [CursorType.MiniSettingsRed]: "Cursor Mini Settings Red",
    [CursorType.MiniSettingsYellow]: "Cursor Mini Settings Yellow",
    [CursorType.MiniShieldGreen]: "Cursor Mini Shield Green",
    [CursorType.MiniShieldRed]: "Cursor Mini Shield Red",
    [CursorType.MoveDown]: "Cursor Move Down",
    [CursorType.MoveLeft]: "Cursor Move Left",
    [CursorType.MoveRight]: "Cursor Move Right",
    [CursorType.MoveUp]: "Cursor Move Up",
    [CursorType.PickaxeGreen]: "Cursor Pickaxe Green",
    [CursorType.PickaxeRed]: "Cursor Pickaxe Red",
    [CursorType.Possible]: "Cursor possible",
    [CursorType.PotionBlue]: "Cursor Potion Blue",
    [CursorType.PotionGreen]: "Cursor Potion Green",
    [CursorType.PotionPurple]: "Cursor Potion Purple",
    [CursorType.PotionRed]: "Cursor Potion Red",
    [CursorType.QuestionGreen]: "Cursor Question Green",
    [CursorType.QuestionYellow]: "Cursor Question Yellow",
    [CursorType.ScytheGreen]: "Cursor Scythe Green",
    [CursorType.ScytheRed]: "Cursor Scythe Red",
    [CursorType.SettingsGreen]: "Cursor Settings Green",
    [CursorType.SettingsRed]: "Cursor Settings Red",
    [CursorType.SettingsYellow]: "Cursor Settings Yellow",
    [CursorType.ShieldGreen]: "Cursor Shield Green",
    [CursorType.ShieldRed]: "Cursor Shield Red",
    [CursorType.Subtract]: "Cursor Subtract",
    [CursorType.TargetMoveA]: "Cursor Target Move A",
    [CursorType.TargetMoveB]: "Cursor Target Move B"
  };

  private currentCursor?: CursorType;
  private currentCursorUrl?: string;
  private mainScene?: ProbableWaffleScene;
  private lastHoveredCursor: CursorType = CursorType.Default;
  private multiSelecting: boolean = false;
  private lockedCursorHandler: LockedCursorHandler;

  constructor(private readonly scene: Phaser.Scene) {
    const gameSettings = GameSettings.loadFromLocalStorage();
    this.lockedCursorHandler = new LockedCursorHandler(scene, this, gameSettings.lockToScreen);
    this.setupCursor();
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    // Listen to multi-selection events from HUD scene
    this.scene.events.on(MULTI_SELECTING, this.onMultiSelecting, this);
  }

  getLockedCursorHandler(): LockedCursorHandler {
    return this.lockedCursorHandler;
  }

  /**
   * Initialize with main game scene to enable hover-based cursor changes
   */
  initializeWithMainScene(mainScene: ProbableWaffleScene) {
    this.mainScene = mainScene;
    this.setupHoverDetection();
  }

  private onMultiSelecting(multiSelecting: boolean) {
    this.multiSelecting = multiSelecting;
  }

  private setupCursor() {
    this.setCursor(CursorType.Default);
  }

  private setupHoverDetection() {
    if (!this.mainScene) return;

    // Listen to pointer move events on the main scene
    this.mainScene.input.on(Input.Events.POINTER_MOVE, this.handlePointerMove, this);
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer, gameObjectsUnderCursor: GameObject[]) {
    if (!this.mainScene) return;

    // Don't change cursor during multi-selection
    if (this.multiSelecting) {
      return;
    }

    // Don't change cursor if building is being placed
    const buildingCursor = getSceneComponent(this.mainScene, BuildingCursor);
    if (buildingCursor?.placingBuilding) {
      return;
    }

    // Don't change cursor if PlayerActionsHandler is currently handling an action
    const playerActionsHandler = getSceneService(this.mainScene, PlayerActionsHandler);
    if (playerActionsHandler?.isHandlingActions()) {
      // During a Move order, show terrain-mismatch feedback
      if (playerActionsHandler.getCurrentOrderType() === OrderType.Move) {
        const terrainCursor = this.getTerrainCursorForPointer(pointer);
        if (terrainCursor !== this.lastHoveredCursor) {
          this.lastHoveredCursor = terrainCursor;
          this.setCursor(terrainCursor);
        }
      }
      return;
    }

    // Get the first selectable game object under cursor
    const selectableObject = gameObjectsUnderCursor.map((go) => getSelectableGameObject(go)).find((go) => !!go);

    const selectedActors = getSelectedActors(this.mainScene);

    if (selectableObject) {
      const contextualCursor = this.determineContextualCursor(
        selectableObject,
        selectedActors,
        playerActionsHandler?.getCurrentOrderType()
      );
      if (contextualCursor !== this.lastHoveredCursor) {
        this.lastHoveredCursor = contextualCursor;
        this.setCursor(contextualCursor);
      }
    } else {
      // No actor under cursor, reset to default
      if (this.lastHoveredCursor !== CursorType.Default) {
        this.lastHoveredCursor = CursorType.Default;
        this.setCursor(CursorType.Default);
      }
    }
  }

  /**
   * Determine the appropriate cursor based on the actor under the cursor
   */
  private determineContextualCursor(
    gameObject: GameObject,
    selectedActors: GameObject[],
    currentOrderType: OrderType | undefined
  ): CursorType {
    if (!this.mainScene) return CursorType.Default;

    const currentPlayerNumber = getCurrentPlayerNumber(this.mainScene);
    const ownerComponent = getActorComponent(gameObject, OwnerComponent);
    const actorOwner = ownerComponent?.getOwner();
    const isEnemy = actorOwner !== undefined && actorOwner !== currentPlayerNumber;
    const isFriendly = actorOwner !== undefined && actorOwner === currentPlayerNumber;

    // If there's a current order, use cursor based on that
    if (currentOrderType) {
      return this.getCursorForOrder(currentOrderType, gameObject, isEnemy);
    }

    // No active order - determine cursor based on actor type and relationship
    // Priority: resource source > enemy > friendly > construction site > container > default

    const hasSelectedActors = selectedActors.length > 0;

    // Check if it's a resource source (tree, mine, etc.)
    const resourceSource = getActorComponent(gameObject, ResourceSourceComponent);
    if (resourceSource) {
      if (hasSelectedActors && selectedActors.some((actor) => !!getActorComponent(actor, GathererComponent))) {
        switch (resourceSource.resourceSourceDefinition.resourceType) {
          case ResourceType.Wood:
            return CursorType.ChopGreen;
          case ResourceType.Stone:
            return CursorType.PickaxeGreen;
          case ResourceType.Minerals:
            return CursorType.PickaxeGreen;
          case ResourceType.Food:
            return CursorType.ScytheGreen;
          default:
            throw new Error(
              `Unhandled resource type for cursor: ${resourceSource.resourceSourceDefinition.resourceType}`
            );
        }
      }
    }

    // Check if it's an enemy
    if (isEnemy) {
      if (hasSelectedActors && selectedActors.some((actor) => !!getActorComponent(actor, AttackComponent))) {
        return CursorType.AttackRed;
      }
      return CursorType.DefaultEnemy;
    }

    // Check if it's a friendly unit/building
    if (isFriendly) {
      return CursorType.DefaultFriends;
    }

    // Check if it's a construction site
    const constructionSite = getActorComponent(gameObject, ConstructionSiteComponent);
    if (constructionSite) {
      if (hasSelectedActors && selectedActors.some((actor) => !!getActorComponent(actor, BuilderComponent))) {
        return CursorType.BuildGreen;
      }
    }

    // Check if it's a container (e.g., building to enter)
    const container = getActorComponent(gameObject, ContainerComponent);
    if (container) {
      if (hasSelectedActors && selectedActors.some((actor) => !!getActorComponent(actor, ContainableComponent))) {
        return CursorType.QuestionGreen;
      }
    }

    return CursorType.Default;
  }

  /**
   * Get cursor for a specific order type when hovering over an actor
   */
  private getCursorForOrder(orderType: OrderType, gameObject: GameObject, isEnemy: boolean): CursorType {
    switch (orderType) {
      case OrderType.Attack: {
        const attackComponent = getActorComponent(gameObject, AttackComponent);
        if (attackComponent) {
          return isEnemy ? CursorType.AttackGreen : CursorType.AttackRed;
        }
        return CursorType.CannotTarget;
      }
      case OrderType.Gather: {
        const resourceSource = getActorComponent(gameObject, ResourceSourceComponent);
        if (resourceSource) {
          return CursorType.ChopGreen;
        }
        return CursorType.CannotTarget;
      }
      case OrderType.Heal: {
        const healable = getActorComponent(gameObject, HealingComponent);
        if (healable && !isEnemy) {
          return CursorType.PotionGreen;
        }
        return CursorType.CannotTarget;
      }
      case OrderType.Repair: {
        const constructionSite = getActorComponent(gameObject, ConstructionSiteComponent);
        if (constructionSite && !isEnemy) {
          return CursorType.BuildGreen;
        }
        return CursorType.CannotTarget;
      }
      case OrderType.Build: {
        const builder = getActorComponent(gameObject, BuilderComponent);
        if (builder) {
          return CursorType.BuildGreen;
        }
        return CursorType.CannotTarget;
      }
      case OrderType.EnterContainer: {
        const container = getActorComponent(gameObject, ContainerComponent);
        if (container) {
          return CursorType.TargetMoveB;
        }
        return CursorType.CannotTarget;
      }
      case OrderType.Move:
      case OrderType.ReturnResources:
      case OrderType.Stop:
      default:
        return CursorType.Default;
    }
  }

  /**
   * Returns the appropriate cursor for the given pointer position based on terrain vs selected actors.
   * Used during an active Move order to show whether the hovered tile is valid terrain.
   */
  private getTerrainCursorForPointer(pointer: Phaser.Input.Pointer): CursorType {
    if (!this.mainScene) return CursorType.TargetMoveA;

    const navigationService = getSceneService(this.mainScene, NavigationService);
    if (!navigationService) return CursorType.TargetMoveA;

    const selectedMovableActors = getSelectedActors(this.mainScene).filter(
      (actor) => !!getActorComponent(actor, ActorTranslateComponent)
    );
    if (selectedMovableActors.length === 0) return CursorType.TargetMoveA;

    try {
      const worldPos = this.mainScene.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const tileXY = IsoHelper.isometricWorldToTileXY(this.mainScene, worldPos.x, worldPos.y, false);
      const allSelectedActorsBlocked = selectedMovableActors.every(
        (actor) => !canActorTraverseTile(actor, navigationService, tileXY)
      );
      if (allSelectedActorsBlocked) return CursorType.Impossible;
    } catch {
      // If tile resolution fails, fall back to default move cursor
    }

    return CursorType.TargetMoveA;
  }

  setCursor(cursorType: CursorType) {
    const cursorName = this.cursors[cursorType];
    this.currentCursor = cursorType;
    this.currentCursorUrl = this.getRawCursorUrl(cursorName);
    this.scene.input.setDefaultCursor(this.getCursorUrl(cursorName));

    // Notify locked cursor handler to update the custom cursor image
    this.lockedCursorHandler.onCursorChanged();
  }

  private getRawCursorUrl(cursor: string): string {
    return `assets/probable-waffle/input/cursors/${cursor}.cur`;
  }

  private getCursorUrl(cursor: string): string {
    return `url("${this.getRawCursorUrl(cursor)}"), auto`;
  }

  getCurrentCursorUrl(): string {
    return this.currentCursorUrl || this.getRawCursorUrl(this.cursors.default);
  }

  getCurrentCursorType(): CursorType {
    return this.currentCursor || CursorType.Default;
  }

  private destroy() {
    if (this.mainScene) {
      this.mainScene.input.off(Input.Events.POINTER_MOVE, this.handlePointerMove, this);
    }
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.scene.events.off(MULTI_SELECTING, this.onMultiSelecting, this);
  }
}
