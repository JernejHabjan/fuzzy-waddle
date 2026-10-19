import { SpellType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/spell-type";
import type { SpellData } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/spell-data";
import { spellDefinitions } from "../components/combat/spell-definitions";
import { DamageType, type StatusEffectData, StatusEffectType } from "@fuzzy-waddle/probable-waffle-protocol";
import { type Vector2Simple, type Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import { getActorComponent } from "../../data/actor-component";
import { SpellComponent } from "../components/combat/components/spell-component";
import { HealthComponent } from "../components/combat/components/health-component";
import { StatusEffectComponent } from "../components/status-effect/status-effect-component";
import { OwnerComponent } from "../components/owner-component";
import { ActorTranslateComponent } from "../components/movement/actor-translate-component";
import { AnimationActorComponent } from "../components/animation/animation-actor-component";
import {
  getGameObjectBounds,
  getGameObjectCurrentTile,
  getGameObjectDepth,
  getGameObjectLogicalTransform,
  onObjectReady
} from "../../data/game-object-helper";
import { getSceneComponent, getSceneService } from "../../world/services/scene-component-helpers";
import { AudioService } from "../../world/services/audio.service";
import { AoeZoneManager } from "./aoe-zone-manager";
import { NavigationService } from "../../world/services/navigation.service";
import { SceneActorCreator } from "../../world/services/scene-actor-creator";
import { CancelableSimDelay } from "../../world/services/simulation-time";
import { DistanceHelper } from "../../library/distance-helper";
import { ProjectileType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/projectile-type";
import { DepthHelper } from "../../world/services/depth.helper";
import { IsoHelper } from "../../world/tilemap/iso-helper";
import Phaser from "phaser";
import { PhaserProjectileFactory } from "../../combat/phaser-projectile-factory";
import { FogOfWarComponent } from "../../world/tilemap/fog-of-war.component";
import type { SoundDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/actor-audio/sound-definition";
import { EffectsAnims } from "../../animations/effects";

export class SpellCastingSystem {
  private spellComponent?: SpellComponent;
  private actorTranslateComponent?: ActorTranslateComponent;
  private animationActorComponent?: AnimationActorComponent;
  private ownerComponent?: OwnerComponent;
  private audioService?: AudioService;
  private fogOfWarComponent?: FogOfWarComponent;
  private aoeZoneManager?: AoeZoneManager;
  private navigationService?: NavigationService;
  private projectileSprite?: Phaser.GameObjects.Image;
  private projectileTween?: Phaser.Tweens.Tween;

  constructor(private readonly gameObject: Phaser.GameObjects.GameObject) {
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
    onObjectReady(gameObject, this.init, this);
  }

  private init(): void {
    this.spellComponent = getActorComponent(this.gameObject, SpellComponent);
    this.actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    this.animationActorComponent = getActorComponent(this.gameObject, AnimationActorComponent);
    this.ownerComponent = getActorComponent(this.gameObject, OwnerComponent);
    this.audioService = getSceneService(this.gameObject.scene, AudioService);
    this.fogOfWarComponent = getSceneComponent(this.gameObject.scene, FogOfWarComponent);
    this.aoeZoneManager = getSceneService(this.gameObject.scene, AoeZoneManager);
    this.navigationService = getSceneService(this.gameObject.scene, NavigationService);
  }

  private destroy(): void {
    this.stopProjectile();
  }

  canCastSpell(spellType: SpellType): boolean {
    if (!this.spellComponent) return false;

    const spellData = spellDefinitions[spellType];
    if (!spellData) return false;

    // Check if spell is available to this caster
    if (!this.spellComponent.availableSpells.includes(spellType)) {
      return false;
    }

    // Check if spell is researched
    if (!this.spellComponent.isSpellResearched(spellType)) {
      return false;
    }

    // Check cooldown
    // noinspection RedundantIfStatementJS
    if (!this.spellComponent.canCastSpell(spellType)) {
      return false;
    }

    return true;
  }

  isInRange(spellType: SpellType, targetTileXYZ: Vector3Simple): boolean {
    const spellData = spellDefinitions[spellType];
    if (!spellData) return false;

    const casterTransform = getGameObjectLogicalTransform(this.gameObject);
    if (!casterTransform) return false;

    const distance = DistanceHelper.getTileDistanceBetweenGameObjectAndTile(this.gameObject, targetTileXYZ);
    return distance !== null && distance <= spellData.range;
  }

  castSpell(spellType: SpellType, targetTileXYZ: Vector3Simple): boolean {
    if (!this.canCastSpell(spellType)) {
      return false;
    }

    const spellData = spellDefinitions[spellType];
    if (!spellData) return false;

    // Check range
    if (!this.isInRange(spellType, targetTileXYZ)) {
      return false;
    }

    // Turn towards target
    const worldXY = this.navigationService?.getTileWorldCenter(targetTileXYZ);
    if (this.actorTranslateComponent && worldXY) {
      this.actorTranslateComponent.turnTowardsPosition(worldXY);
    }

    // Play cast animation
    if (this.animationActorComponent && spellData.castAnimation) {
      this.animationActorComponent.playCustomAnimation(spellData.castAnimation, {
        forceRestart: true
      });
    }

    this.playCastSound(spellData.sounds?.cast);

    // Spawn projectile or apply effects immediately
    if (spellData.projectile) {
      this.spawnProjectile(spellData, targetTileXYZ);
    } else {
      // Instant cast - apply effects immediately
      this.applySpellEffects(spellData, targetTileXYZ);
      if (worldXY) this.playInstantImpactFeedback(spellData, targetTileXYZ, worldXY);
    }

    // Start cooldown
    if (this.spellComponent) {
      this.spellComponent.startCooldown(spellType);
    }

    return true;
  }

  private spawnProjectile(spellData: SpellData, targetPosition: Vector2Simple): void {
    const projectile = spellData.projectile;
    if (!projectile) return;

    const position = getGameObjectBounds(this.gameObject);
    if (!position) return;

    // Convert target tile position to world position
    const targetWorld = this.navigationService?.getTileWorldCenter(targetPosition);
    if (!targetWorld) return;

    // Create projectile sprite
    const projectileSprite =
      PhaserProjectileFactory.create(this.gameObject.scene, projectile.type) ??
      PhaserProjectileFactory.create(this.gameObject.scene, ProjectileType.FrostBoltProjectile); // Default to frost bolt

    if (!projectileSprite) return;

    this.projectileSprite = projectileSprite;
    this.gameObject.scene.add.existing(projectileSprite);
    projectileSprite.setOrigin(0.5, 0.5);
    DepthHelper.setActorDepth(this.gameObject);

    // Check spawn behavior config (default to 'launch')
    const spawnBehavior = projectile.spawnBehavior ?? { type: "launch" };

    if (spawnBehavior.type === "fall") {
      // Projectile falls from above target
      const spawnOffsetY = spawnBehavior.spawnOffsetY ?? -200; // Default 200 pixels above
      projectileSprite.setPosition(targetWorld.x, targetWorld.y + spawnOffsetY);

      // Set rotation to point downward
      if (!projectile.orientation.randomizeOrientation) {
        projectileSprite.setRotation(Phaser.Math.DegToRad(90)); // Point straight down
      }

      // Calculate flight time based on vertical distance
      const projectileSpeed = projectile.speed;
      const distance = Math.abs(spawnOffsetY);
      const duration = (distance / projectileSpeed) * 1000;

      // Animate projectile falling straight down
      this.projectileTween = this.gameObject.scene.tweens.add({
        targets: projectileSprite,
        y: targetWorld.y,
        duration: duration,
        ease: spawnBehavior.ease ?? "Cubic.easeIn", // Default to gravity-like acceleration
        onComplete: () => {
          this.onProjectileImpact(spellData, targetPosition, targetWorld);
          this.stopProjectile();
        }
      });
    } else {
      // Normal projectile behavior - launch from caster to target
      projectileSprite.setPosition(position.centerX, position.centerY);

      // Calculate flight time
      const projectileSpeed = projectile.speed;
      const distance = Phaser.Math.Distance.Between(position.centerX, position.centerY, targetWorld.x, targetWorld.y);
      const duration = (distance / projectileSpeed) * 1000;

      // Rotate projectile towards target
      if (!projectile.orientation.randomizeOrientation) {
        const angle = Phaser.Math.Angle.Between(position.centerX, position.centerY, targetWorld.x, targetWorld.y);
        projectileSprite.setRotation(angle);
      }

      // Animate projectile flight
      this.projectileTween = this.gameObject.scene.tweens.add({
        targets: projectileSprite,
        x: targetWorld.x,
        y: targetWorld.y,
        duration: duration,
        ease: spawnBehavior.ease ?? "Linear", // Default to linear movement
        onComplete: () => {
          this.onProjectileImpact(spellData, targetPosition, targetWorld);
          this.stopProjectile();
        }
      });
    }
  }

  private onProjectileImpact(
    spellData: SpellData,
    targetTilePosition: Vector2Simple,
    targetWorldPosition: Vector2Simple
  ): void {
    this.playImpactEffect(spellData, targetTilePosition, targetWorldPosition);

    // Play impact sound
    this.playImpactSound(spellData.sounds?.impact, targetTilePosition);

    // Apply spell effects
    this.applySpellEffects(spellData, targetTilePosition);
  }

  /**
   * Plays cosmetic impact feedback from the projectile's resolved position when
   * that tile is currently visible to the local player.
   */
  private playImpactSound(impactSound: SoundDefinition | undefined, targetTilePosition: Vector2Simple): void {
    if (!impactSound || !this.audioService || !this.projectileSprite) return;
    if (!this.isTileVisible(targetTilePosition)) return;

    this.audioService.playSpatialAudioSprite(this.projectileSprite, impactSound.key, impactSound.spriteName);
  }

  /** Plays configured cast feedback only while the caster remains visible to the local player. */
  private playCastSound(castSound: SoundDefinition | undefined): void {
    const casterTilePosition = getGameObjectCurrentTile(this.gameObject);
    if (!castSound || !this.audioService || !casterTilePosition || !this.isTileVisible(casterTilePosition)) return;

    this.audioService.playSpatialAudioSprite(this.gameObject, castSound.key, castSound.spriteName);
  }

  /** Creates cosmetic impact VFX at a visible resolved position without affecting spell resolution. */
  private playImpactEffect(
    spellData: SpellData,
    targetTilePosition: Vector2Simple,
    targetWorldPosition: Vector2Simple
  ): void {
    const impactAnimation = spellData.projectile?.impactAnimation;
    if (!impactAnimation || !this.isTileVisible(targetTilePosition)) return;

    const animation = impactAnimation.anims[Math.floor(Math.random() * impactAnimation.anims.length)];
    if (!animation) return;

    const impactSprite = EffectsAnims.createAndPlayEffectAnimation(
      this.gameObject.scene,
      animation,
      targetWorldPosition.x,
      targetWorldPosition.y
    );
    const projectileDepth = this.projectileSprite ? getGameObjectDepth(this.projectileSprite) : null;
    if (projectileDepth !== null) impactSprite.setDepth(projectileDepth + 1);
    if (impactAnimation.tint !== undefined) impactSprite.setTint(impactAnimation.tint);
  }

  /** Plays the single resolved impact feedback for spells that apply without a projectile. */
  private playInstantImpactFeedback(
    spellData: SpellData,
    targetTilePosition: Vector2Simple,
    targetWorldPosition: Vector2Simple
  ): void {
    if (!spellData.sounds?.impact || !this.audioService || !this.isTileVisible(targetTilePosition)) return;

    const impactSource = this.gameObject.scene.add.zone(targetWorldPosition.x, targetWorldPosition.y, 1, 1);
    const playback = this.audioService.playSpatialAudioSprite(
      impactSource,
      spellData.sounds.impact.key,
      spellData.sounds.impact.spriteName,
      undefined,
      { onComplete: () => impactSource.destroy() }
    );
    if (!playback) impactSource.destroy();
  }

  /** Treats fog absence, explored tiles, and unexplored tiles as non-visible cosmetic locations. */
  private isTileVisible(tilePosition: Vector2Simple): boolean {
    return this.fogOfWarComponent?.getTileVisibility(tilePosition.x, tilePosition.y) === "visible";
  }

  private applySpellEffects(spellData: SpellData, targetPosition: Vector2Simple): void {
    // Handle persistent zone spells
    if (spellData.persistentZone) {
      this.createPersistentZone(spellData, targetPosition);
      return;
    }

    // Handle spawn prefab spells
    if (spellData.spawnPrefab) {
      this.spawnPrefab(spellData, targetPosition);
      return;
    }

    // Find actors in AOE
    const affectedActors = this.findActorsInAoe(spellData, targetPosition);

    // Apply effects to each affected actor
    for (const actor of affectedActors) {
      this.applyEffectsToActor(spellData, actor);
    }
  }

  private findActorsInAoe(spellData: SpellData, targetPosition: Vector2Simple): Phaser.GameObjects.GameObject[] {
    const actors: Phaser.GameObjects.GameObject[] = [];
    const casterPlayerId = this.ownerComponent?.getOwner() ?? -1;

    // Convert AOE radius from tiles to world pixels (approximate)
    const aoeRadiusPixels = spellData.aoeRadius * 64; // Approximate tile size

    // Convert target position to world position
    const targetWorld = this.navigationService?.getTileWorldCenter(targetPosition);
    if (!targetWorld) return actors;

    // Iterate through all game objects
    for (const gameObject of this.gameObject.scene.children.list) {
      const healthComponent = getActorComponent(gameObject, HealthComponent);
      if (!healthComponent || !healthComponent.alive) continue;

      // Get actor position
      const actorBounds = getGameObjectBounds(gameObject);
      if (!actorBounds) continue;

      // Check distance from target position
      const distance = Phaser.Math.Distance.Between(
        targetWorld.x,
        targetWorld.y,
        actorBounds.centerX,
        actorBounds.centerY
      );

      if (distance > aoeRadiusPixels) continue;

      // Check ally/enemy targeting
      const actorOwner = getActorComponent(gameObject, OwnerComponent);
      const actorPlayerId = actorOwner?.getOwner() ?? -1;
      const isAlly = actorPlayerId === casterPlayerId;
      const isSelf = gameObject === this.gameObject;

      if (isSelf && !spellData.targetSelf) continue;
      if (isAlly && !isSelf && !spellData.targetAllies) continue;
      if (!isAlly && !spellData.targetEnemies) continue;

      actors.push(gameObject);
    }

    return actors;
  }

  private applyEffectsToActor(spellData: SpellData, target: Phaser.GameObjects.GameObject): void {
    const healthComponent = getActorComponent(target, HealthComponent);
    const statusEffectComponent = getActorComponent(target, StatusEffectComponent);

    // Apply instant damage
    if (spellData.instantDamage && healthComponent && spellData.damageType !== undefined) {
      healthComponent.takeDamage(spellData.instantDamage, spellData.damageType, this.gameObject);
    }

    // Apply instant heal
    if (spellData.instantHeal && healthComponent) {
      healthComponent.heal(spellData.instantHeal);
    }

    // Apply DoT effect
    if (spellData.dotDamage && spellData.dotDuration && statusEffectComponent) {
      const dotEffect: StatusEffectData = {
        type: this.getDotEffectType(spellData),
        duration: spellData.dotDuration,
        remainingTime: spellData.dotDuration,
        damagePerTick: spellData.dotDamage,
        tickInterval: spellData.dotTickInterval ?? 1000,
        damageType: spellData.damageType,
        tintColor: spellData.tintColor
      };
      statusEffectComponent.applyEffect(dotEffect);
    }

    // Apply HoT effect
    if (spellData.hotHeal && spellData.hotDuration && statusEffectComponent) {
      const hotEffect: StatusEffectData = {
        type: StatusEffectType.Regenerating,
        duration: spellData.hotDuration,
        remainingTime: spellData.hotDuration,
        healPerTick: spellData.hotHeal,
        tickInterval: spellData.hotTickInterval ?? 1000,
        tintColor: spellData.tintColor
      };
      statusEffectComponent.applyEffect(hotEffect);
    }

    // Apply stun effect
    if (spellData.stunDuration && statusEffectComponent) {
      const stunEffect: StatusEffectData = {
        type: this.getStunEffectType(spellData),
        duration: spellData.stunDuration,
        remainingTime: spellData.stunDuration,
        tintColor: spellData.tintColor
      };
      statusEffectComponent.applyEffect(stunEffect);
    }

    // Apply slow effect
    if (spellData.slowDuration && spellData.slowAmount && statusEffectComponent) {
      const slowEffect: StatusEffectData = {
        type: StatusEffectType.Slowed,
        duration: spellData.slowDuration,
        remainingTime: spellData.slowDuration,
        movementSpeedModifier: spellData.slowAmount,
        tintColor: spellData.tintColor
      };
      statusEffectComponent.applyEffect(slowEffect);
    }
  }

  private getDotEffectType(spellData: SpellData): StatusEffectType {
    switch (spellData.damageType) {
      case DamageType.Fire:
        return StatusEffectType.Burning;
      case DamageType.Poison:
        return StatusEffectType.Poisoned;
      case DamageType.Frost:
        return StatusEffectType.Frozen;
      default:
        return StatusEffectType.Burning;
    }
  }

  private getStunEffectType(spellData: SpellData): StatusEffectType {
    switch (spellData.damageType) {
      case DamageType.Frost:
        return StatusEffectType.Frozen;
      case DamageType.Fire:
        return StatusEffectType.Burning;
      default:
        return StatusEffectType.Stunned;
    }
  }

  private createPersistentZone(spellData: SpellData, targetPosition: Vector2Simple): void {
    if (!spellData.persistentZone || !this.aoeZoneManager) return;

    const targetWorld = this.navigationService?.getTileWorldCenter(targetPosition);
    if (!targetWorld) return;

    // Create the status effect that will be applied while inside the zone
    const effectWhileInside: StatusEffectData = {
      type: spellData.targetEnemies ? StatusEffectType.Burning : StatusEffectType.Regenerating,
      duration: spellData.dotDuration ?? spellData.hotDuration ?? 2000,
      remainingTime: spellData.dotDuration ?? spellData.hotDuration ?? 2000,
      damagePerTick: spellData.dotDamage,
      healPerTick: spellData.hotHeal,
      tickInterval: spellData.dotTickInterval ?? spellData.hotTickInterval ?? 1000,
      tintColor: spellData.tintColor
    };

    this.aoeZoneManager.createZone({
      spellType: spellData.type,
      worldPosition: targetWorld,
      radius: spellData.aoeRadius,
      duration: spellData.persistentZone.duration,
      tickInterval: spellData.persistentZone.tickInterval,
      effectWhileInside,
      affectsAllies: spellData.targetAllies,
      affectsEnemies: spellData.targetEnemies,
      visualEffect: spellData.persistentZone.visualEffect,
      tintColor: spellData.tintColor,
      sourcePlayerId: this.ownerComponent?.getOwner() ?? -1
    });
  }

  private spawnPrefab(spellData: SpellData, targetPosition: Vector2Simple): void {
    if (!spellData.spawnPrefab) return;

    const sceneActorCreator = getSceneService(this.gameObject.scene, SceneActorCreator);
    if (!sceneActorCreator) {
      console.error("SceneActorCreator not found");
      return;
    }

    // Convert tile position to world position
    const worldPosition = IsoHelper.isometricTileToWorldXY(this.gameObject.scene, targetPosition.x, targetPosition.y);
    const position: Vector3Simple = {
      x: worldPosition.x,
      y: worldPosition.y,
      z: 0
    };

    // Get owner if inheritOwner is set
    const ownerId =
      spellData.spawnPrefab.inheritOwner && this.ownerComponent ? this.ownerComponent.getOwner() : undefined;

    // Spawn the prefab using helper
    const newGameObject = sceneActorCreator.createFinishedActor(spellData.spawnPrefab.prefabName, position, ownerId);

    if (newGameObject) {
      // If the prefab has a duration, schedule its destruction
      if (spellData.spawnPrefab.duration) {
        new CancelableSimDelay(this.gameObject.scene, spellData.spawnPrefab.duration, () => {
          if (!newGameObject.active || !newGameObject.scene) return; // Already destroyed
          const healthComponent = getActorComponent(newGameObject, HealthComponent);
          if (healthComponent) {
            healthComponent.killActor();
          } else {
            newGameObject.destroy();
          }
        });
      }
    }
  }

  private stopProjectile(): void {
    if (this.projectileTween) {
      this.projectileTween.stop();
      this.projectileTween = undefined;
    }
    if (this.projectileSprite) {
      this.projectileSprite.destroy();
      this.projectileSprite = undefined;
    }
  }
}
