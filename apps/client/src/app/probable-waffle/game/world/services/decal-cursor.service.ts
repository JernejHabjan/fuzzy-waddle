import type { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { NavigationService } from "./navigation.service";
import { getSceneService } from "./scene-component-helpers";

export class DecalCursorService {
  private moveMarkerSprite?: Phaser.GameObjects.Image;
  private inaccessibleMarkerSprite?: Phaser.GameObjects.Image;
  private currentDestination?: Vector3Simple;
  private navigationService?: NavigationService;
  private inaccessibleTimer?: Phaser.Time.TimerEvent;

  private static readonly MOVE_MARKER_KEY = 'decal-move-marker';
  private static readonly INACCESSIBLE_MARKER_KEY = 'decal-inaccessible-marker';

  constructor(private readonly scene: Phaser.Scene) {
    this.navigationService = getSceneService(scene, NavigationService);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.preloadSprites();
  }

  /**
   * Preload the decal sprites
   */
  private preloadSprites(): void {
    // Only load if not already loaded
    if (!this.scene.textures.exists(DecalCursorService.MOVE_MARKER_KEY)) {
      this.scene.load.image(
        DecalCursorService.MOVE_MARKER_KEY,
        'assets/probable-waffle/sprites/gui/decals/move-marker.png'
      );
    }
    if (!this.scene.textures.exists(DecalCursorService.INACCESSIBLE_MARKER_KEY)) {
      this.scene.load.image(
        DecalCursorService.INACCESSIBLE_MARKER_KEY,
        'assets/probable-waffle/sprites/gui/decals/inaccessible-marker.png'
      );
    }
    
    // Start the load if there are pending loads
    if (this.scene.load.isLoading() || this.scene.load.list.size > 0) {
      this.scene.load.once(Phaser.Loader.Events.COMPLETE, () => {
        // Sprites are now ready to use
      });
      this.scene.load.start();
    }
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
      this.moveMarkerSprite = this.scene.add.image(worldXY.x, worldXY.y, DecalCursorService.MOVE_MARKER_KEY);
      this.moveMarkerSprite.setDepth(1000); // Ensure it's visible above terrain
      this.moveMarkerSprite.setOrigin(0.5, 1); // Anchor at bottom center like a flag
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
        DecalCursorService.INACCESSIBLE_MARKER_KEY
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
