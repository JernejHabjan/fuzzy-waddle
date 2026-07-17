import type { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { NavigationService } from "../../../world/services/navigation.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { canActorTraverseTile, onObjectReady } from "../../../data/game-object-helper";
import { getActorComponent } from "../../../data/actor-component";
import { SelectableComponent } from "../selectable-component";
import { PawnAiController } from "../../../prefabs/ai-agents/pawn-ai-controller";
import type { Subscription } from "rxjs";
import { OrderType } from "../../../ai/order-type";
import { OwnerComponent } from "../owner-component";
import { getCurrentPlayerNumber } from "../../../data/scene-data";

export class MovementDecalCursorService {
  private moveMarkerSprite?: Phaser.GameObjects.Image;
  private inaccessibleMarkerSprite?: Phaser.GameObjects.Image;
  private currentDestination?: Vector3Simple;
  private navigationService?: NavigationService;
  private inaccessibleTimer?: Phaser.Time.TimerEvent;
  private selectableComponent?: SelectableComponent;
  private pawnAiController?: PawnAiController;
  private selectionChangedSubscription?: Subscription;
  private currentOrderChangedSubscription?: Subscription;
  private ownerComponent?: OwnerComponent;

  constructor(private readonly gameObject: Phaser.GameObjects.GameObject) {
    onObjectReady(gameObject, this.init, this);
    this.gameObject.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  private init() {
    this.navigationService = getSceneService(this.gameObject.scene, NavigationService);
    this.selectableComponent = getActorComponent(this.gameObject, SelectableComponent);
    this.pawnAiController = getActorComponent(this.gameObject, PawnAiController);
    this.ownerComponent = getActorComponent(this.gameObject, OwnerComponent);
    this.subscribeOnSelectionChanges();
    this.subscribeOnAIDestinationChanges();
  }

  private subscribeOnSelectionChanges(): void {
    if (!this.selectableComponent) return;
    this.selectionChangedSubscription = this.selectableComponent.selectionChanged.subscribe(() => {
      this.handleVisibility();
    });
  }

  private handleVisibility(): void {
    if (!this.currentDestination) return;
    const selected = this.selectableComponent?.getSelected();
    if (!this.ownerComponent || this.ownerComponent.getOwner() !== getCurrentPlayerNumber(this.gameObject.scene)) {
      this.hideMoveMarker();
      return;
    }
    if (!selected) {
      this.hideMoveMarker();
    } else {
      this.reshowMoveMarker();
    }
  }

  private subscribeOnAIDestinationChanges(): void {
    if (!this.pawnAiController) return;
    this.currentOrderChangedSubscription = this.pawnAiController.blackboard.currentOrderChanged.subscribe(() => {
      const currentOrder = this.pawnAiController?.blackboard?.getCurrentOrder();
      if (currentOrder?.orderType === OrderType.Move && currentOrder.data.targetTileLocation) {
        this.showMoveMarker(currentOrder.data.targetTileLocation);
      } else {
        this.clearCurrentDestination();
        this.hideMoveMarker();
      }
    });
  }

  /**
   * Shows a move marker at the specified tile position
   * @param tileVec3 The tile position to show the marker at
   */
  private showMoveMarker(tileVec3: Vector3Simple): void {
    if (!this.navigationService) return;

    const tileWorldXY = this.navigationService.getTileWorldCenter(tileVec3);
    if (!tileWorldXY) return;

    // Check if terrain is accessible using the unit's own terrain type
    const isAccessible = canActorTraverseTile(this.gameObject, this.navigationService, { x: tileVec3.x, y: tileVec3.y });

    if (isAccessible) {
      this.showAccessibleMarker(tileWorldXY, tileVec3);
    } else {
      this.showInaccessibleMarker(tileWorldXY);
    }
  }

  /**
   * Shows a green flag marker for accessible terrain
   */
  private showAccessibleMarker(worldXY: Vector2Simple, tileVec3: Vector3Simple): void {
    this.hideInaccessibleMarker();

    // Store current destination
    this.currentDestination = tileVec3;

    // Create or update move marker
    if (!this.moveMarkerSprite) {
      this.moveMarkerSprite = this.gameObject.scene.add.image(worldXY.x, worldXY.y, "gui", "decals/move-marker.png");
      this.moveMarkerSprite.setDepth(1000); // Ensure it's visible above terrain
      this.moveMarkerSprite.setOrigin(0.5, 0.5); // Anchor at bottom centre like a flag
    } else {
      this.moveMarkerSprite.setPosition(worldXY.x, worldXY.y);
      this.moveMarkerSprite.setVisible(true);
    }
  }

  /**
   * Shows a red X marker for inaccessible terrain for 1 second
   */
  private showInaccessibleMarker(worldXY: Vector2Simple): void {
    this.hideMoveMarker();
    this.clearCurrentDestination();

    // Clear any existing timer
    if (this.inaccessibleTimer) {
      this.inaccessibleTimer.remove();
      this.inaccessibleTimer = undefined;
    }

    // Create or update inaccessible marker
    if (!this.inaccessibleMarkerSprite) {
      this.inaccessibleMarkerSprite = this.gameObject.scene.add.image(
        worldXY.x,
        worldXY.y,
        "gui",
        "decals/inaccessible-marker.png"
      );
      this.inaccessibleMarkerSprite.setDepth(1000);
      this.inaccessibleMarkerSprite.setOrigin(0.5, 0.5);
    } else {
      this.inaccessibleMarkerSprite.setPosition(worldXY.x, worldXY.y);
      this.inaccessibleMarkerSprite.setVisible(true);
    }

    // Hide after 1 second
    // Intentional wall-clock timer: marker auto-hide is UI-only feedback.
    this.inaccessibleTimer = this.gameObject.scene.time.delayedCall(1000, () => {
      this.hideInaccessibleMarker();
    });
  }

  /**
   * Hides the move marker
   */
  private hideMoveMarker(): void {
    if (this.moveMarkerSprite) {
      this.moveMarkerSprite.setVisible(false);
    }
  }

  /**
   * Hides the inaccessible marker
   */
  private hideInaccessibleMarker(): void {
    if (this.inaccessibleMarkerSprite) {
      this.inaccessibleMarkerSprite.setVisible(false);
    }
    if (this.inaccessibleTimer) {
      this.inaccessibleTimer.remove();
      this.inaccessibleTimer = undefined;
    }
  }

  /**
   * Re-shows the move marker if there's a current destination
   * This is used when a player re-selects an actor that's still travelling
   */
  private reshowMoveMarker(): void {
    if (this.currentDestination && this.navigationService) {
      const tileWorldXY = this.navigationService.getTileWorldCenter(this.currentDestination);
      if (tileWorldXY) {
        this.showAccessibleMarker(tileWorldXY, this.currentDestination);
      }
    }
  }

  /**
   * Clears the current destination
   */
  private clearCurrentDestination(): void {
    this.currentDestination = undefined;
  }

  /**
   * Cleanup
   */
  private destroy(): void {
    if (this.moveMarkerSprite) {
      this.moveMarkerSprite.destroy();
      this.moveMarkerSprite = undefined;
    }
    if (this.inaccessibleMarkerSprite) {
      this.inaccessibleMarkerSprite.destroy();
      this.inaccessibleMarkerSprite = undefined;
    }
    if (this.inaccessibleTimer) {
      this.inaccessibleTimer.remove();
      this.inaccessibleTimer = undefined;
    }
    this.selectionChangedSubscription?.unsubscribe();
    this.currentOrderChangedSubscription?.unsubscribe();
  }
}
