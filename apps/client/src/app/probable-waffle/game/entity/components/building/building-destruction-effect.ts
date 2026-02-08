import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectDepth } from "../../../data/game-object-helper";
import { FadeOutComponent } from "./fade-out-component";
import type { FadeOutDefinition } from "./fade-out-definition";
import { RepresentableComponent } from "../representable-component";
import { pwActorDefinitions } from "../../../prefabs/definitions/actor-definitions";
import { ObjectNames } from "@fuzzy-waddle/api-interfaces";
import type { RepresentableDefinition } from "../representable-definition";
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
    const representableComponent = getActorComponent(buildingGameObject, RepresentableComponent);
    if (!representableComponent) return;
    const renderedTransform = representableComponent.renderedWorldTransform;

    const definition = pwActorDefinitions[buildingGameObject.name as ObjectNames]!.components?.representable;
    if (!definition) throw new Error("BuildingDestructionEffect: Missing representable definition for building.");

    const buildingDepth = getGameObjectDepth(buildingGameObject) ?? undefined;

    // Spawn rubble
    this.spawnRubble(scene, renderedTransform.x, renderedTransform.y, definition, buildingDepth);

    // Spawn smoke clouds
    this.spawnSmokeClouds(scene, renderedTransform.x, renderedTransform.y, definition);
  }

  /**
   * Creates a rubble sprite at the building location
   */
  private static spawnRubble(
    scene: Phaser.Scene,
    x: number,
    y: number,
    representableDefinition: RepresentableDefinition,
    buildingDepth: number | undefined
  ): void {
    // Randomize rubble variation
    const rubbleIndex = Phaser.Math.Between(0, this.RUBBLE_SPRITES.length - 1);
    const rubbleSprite = this.RUBBLE_SPRITES[rubbleIndex]!;

    // Create rubble image
    const rubble = scene.add.image(x, y, "factions", rubbleSprite);

    // Scale to match building footprint
    const rubbleTexture = rubble.texture.get(rubbleSprite);
    const scaleX = representableDefinition.width / rubbleTexture.width;
    const scaleY = representableDefinition.width / 2 / rubbleTexture.height;
    rubble.setScale(scaleX, scaleY);
    rubble.alpha = 0.5;
    rubble.y -= representableDefinition.width / 4;

    // Set depth slightly below destroyed building
    if (buildingDepth !== undefined) {
      rubble.setDepth(buildingDepth - 1);
    }

    // Add fade-out effect
    const fadeOutDefinition = {
      durationBeforeFadeOutMs: 30000, // 30 seconds
      fadeOutDurationMs: 5000 // 5 seconds
    } satisfies FadeOutDefinition;

    new FadeOutComponent(rubble, fadeOutDefinition);
  }

  /**
   * Spawns multiple smoke cloud effects with rising animation
   */
  private static spawnSmokeClouds(
    scene: Phaser.Scene,
    x: number,
    y: number,
    representableDefinition: RepresentableDefinition
  ): void {
    const cloudCount = Phaser.Math.Between(representableDefinition.width / 20, representableDefinition.width / 2 / 20);

    for (let i = 0; i < cloudCount; i++) {
      // Random offset within building bounds
      const offsetX = Phaser.Math.Between(-representableDefinition.width / 2, representableDefinition.width / 2);
      const offsetY =
        Phaser.Math.Between(-(representableDefinition.width / 2) / 2, representableDefinition.width / 2 / 2) -
        representableDefinition.width / 4;

      const cloud = scene.add.image(x + offsetX, y + offsetY, "factions", this.SMOKE_SPRITE);

      // Rotate to horizontal orientation
      cloud.setAngle(90);
      cloud.setAlpha(0.8);

      // Scale based on building size
      const scale = Math.min(representableDefinition.width / 100, representableDefinition.width / 2 / 100);
      cloud.setScale(scale);

      // High depth so smoke appears above everything
      cloud.setDepth(1000000);

      // Rising and fade-in animation
      scene.tweens.add({
        targets: cloud,
        y: cloud.y - 40,
        alpha: 0.0,
        duration: 2000,
        ease: "Sine.easeOut"
      });
    }
  }
}
