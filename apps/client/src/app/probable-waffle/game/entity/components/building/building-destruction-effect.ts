import { getActorComponent } from "../../../data/actor-component";
import { ActorTranslateComponent } from "../movement/actor-translate-component";
import { getGameObjectBounds, getGameObjectDepth } from "../../../data/game-object-helper";
import { RubbleComponent } from "./rubble-component";
import type { RubbleDefinition } from "./rubble-definition";
import GameObject = Phaser.GameObjects.GameObject;

/**
 * Static utility for creating building destruction visual effects
 */
export class BuildingDestructionEffect {
  private static readonly RUBBLE_SPRITES = [
    "buildings/misc/ruins-flat/ruins-flat-1.png",
    "buildings/misc/ruins-flat/ruins-flat-2.png"
  ];

  private static readonly SMOKE_SPRITE = "buildings/skaduwee/infantry_inn/cloud-vertical.png";

  /**
   * Spawns rubble and smoke effects when a building is destroyed
   */
  static spawnDestructionEffects(buildingGameObject: GameObject): void {
    const scene = buildingGameObject.scene;
    if (!scene) return;

    // Get building position and bounds for proper scaling
    const actorTranslateComponent = getActorComponent(buildingGameObject, ActorTranslateComponent);
    if (!actorTranslateComponent) return;

    const renderedTransform = actorTranslateComponent.renderedTransform;
    const bounds = getGameObjectBounds(buildingGameObject);
    if (!bounds) return;

    const buildingDepth = getGameObjectDepth(buildingGameObject) ?? undefined;

    // Spawn rubble
    this.spawnRubble(scene, renderedTransform.x, renderedTransform.y, bounds, buildingDepth);

    // Spawn smoke clouds
    this.spawnSmokeClouds(scene, renderedTransform.x, renderedTransform.y, bounds);
  }

  /**
   * Creates a rubble sprite at the building location
   */
  private static spawnRubble(
    scene: Phaser.Scene,
    x: number,
    y: number,
    bounds: Phaser.Geom.Rectangle,
    buildingDepth: number | undefined
  ): void {
    // Randomize rubble variation
    const rubbleIndex = Phaser.Math.Between(0, this.RUBBLE_SPRITES.length - 1);
    const rubbleSprite = this.RUBBLE_SPRITES[rubbleIndex]!;

    // Create rubble image
    const rubble = scene.add.image(x, y, "factions", rubbleSprite);

    // Scale to match building footprint
    const rubbleTexture = rubble.texture.get(rubbleSprite);
    const scaleX = bounds.width / rubbleTexture.width;
    const scaleY = bounds.height / rubbleTexture.height;
    rubble.setScale(scaleX, scaleY);

    // Set depth slightly below destroyed building
    if (buildingDepth !== undefined) {
      rubble.setDepth(buildingDepth - 1);
    }

    // Add rubble component to manage lifecycle
    const rubbleDefinition: RubbleDefinition = {
      durationMs: 30000, // 30 seconds
      fadeOutDurationMs: 5000, // 5 seconds
      rubbleSprites: this.RUBBLE_SPRITES
    };

    new RubbleComponent(rubble, rubbleDefinition);
  }

  /**
   * Spawns multiple smoke cloud effects with rising animation
   */
  private static spawnSmokeClouds(
    scene: Phaser.Scene,
    x: number,
    y: number,
    bounds: Phaser.Geom.Rectangle
  ): void {
    const cloudCount = Phaser.Math.Between(2, 4);

    for (let i = 0; i < cloudCount; i++) {
      // Random offset within building bounds
      const offsetX = Phaser.Math.Between(-bounds.width / 2, bounds.width / 2);
      const offsetY = Phaser.Math.Between(-bounds.height / 2, bounds.height / 2);

      const cloud = scene.add.image(x + offsetX, y + offsetY, "factions", this.SMOKE_SPRITE);

      // Rotate to horizontal orientation
      cloud.setAngle(90);
      cloud.setAlpha(0);

      // Scale based on building size
      const scale = Math.min(bounds.width / 200, bounds.height / 200);
      cloud.setScale(scale);

      // High depth so smoke appears above everything
      cloud.setDepth(1000000);

      // Rising and fade-in animation
      scene.tweens.add({
        targets: cloud,
        y: cloud.y - 100,
        alpha: 0.5,
        duration: 2000,
        ease: "Cubic.easeOut",
        onComplete: () => {
          // Fade out animation
          scene.tweens.add({
            targets: cloud,
            alpha: 0,
            duration: 1000,
            onComplete: () => cloud.destroy()
          });
        }
      });
    }
  }
}
