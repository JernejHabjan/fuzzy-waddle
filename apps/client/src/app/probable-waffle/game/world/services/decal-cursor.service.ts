import type { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { NavigationService } from "./navigation.service";
import { getSceneService } from "./scene-component-helpers";
import { onSceneInitialized } from "../../data/game-object-helper";

export class DecalCursorService {
  private moveMarkerSprite?: Phaser.GameObjects.Image;
  private inaccessibleMarkerSprite?: Phaser.GameObjects.Image;
  private currentDestination?: Vector3Simple;
  private navigationService?: NavigationService;
  private inaccessibleTimer?: Phaser.Time.TimerEvent;

  constructor(private readonly scene: Phaser.Scene) {
    onSceneInitialized(scene, this.initService, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }
  private initService(): void {
    this.navigationService = getSceneService(this.scene, NavigationService);
  }
  /**
   * Shows a move marker at the specified tile position
   * @param tileVec3 The tile position to show the marker at
   */
  showMoveMarker(tileVec3: Vector3Simple): void {
    if (!this.navigationService) return;

    const tileWorldXY = this.navigationService.getTileWorldCenter(tileVec3);
    if (!tileWorldXY) return;

    // Check if terrain is accessible
    const isAccessible = this.navigationService.isTileWalkable({ x: tileVec3.x, y: tileVec3.y });

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
      this.moveMarkerSprite = this.scene.add.image(worldXY.x, worldXY.y, "gui", "decals/move-marker.png");
      this.moveMarkerSprite.setDepth(1000); // Ensure it's visible above terrain
      this.moveMarkerSprite.setOrigin(0.5, 0.5); // Anchor at bottom center like a flag
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
      this.inaccessibleMarkerSprite = this.scene.add.image(
        worldXY.x,
        worldXY.y,
        "gui",
        "decal_cursors/inaccessible-marker.png"
      );
      this.inaccessibleMarkerSprite.setDepth(1000);
      this.inaccessibleMarkerSprite.setOrigin(0.5, 0.5);
    } else {
      this.inaccessibleMarkerSprite.setPosition(worldXY.x, worldXY.y);
      this.inaccessibleMarkerSprite.setVisible(true);
    }

    // Hide after 1 second
    this.inaccessibleTimer = this.scene.time.delayedCall(1000, () => {
      this.hideInaccessibleMarker();
    });
  }

  /**
   * Hides the move marker
   */
  hideMoveMarker(): void {
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
   * This is used when a player re-selects an actor that's still traveling
   */
  reshowMoveMarker(): void {
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
  clearCurrentDestination(): void {
    this.currentDestination = undefined;
  }

  /**
   * Gets the current destination
   */
  getCurrentDestination(): Vector3Simple | undefined {
    return this.currentDestination;
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
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }
}
