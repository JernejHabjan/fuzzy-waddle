import { SpellType } from "../components/combat/spell-type";
import type { SpellData } from "../components/combat/spell-data";
import { spellDefinitions } from "../components/combat/spell-definitions";
import {
  type ActorDefinition,
  ConstructionStateEnum,
  type StatusEffectData,
  StatusEffectType,
  type Vector2Simple,
  type Vector3Simple
} from "@fuzzy-waddle/api-interfaces";
import { getActorComponent } from "../../data/actor-component";
import { SpellComponent } from "../components/combat/components/spell-component";
import { HealthComponent } from "../components/combat/components/health-component";
import { StatusEffectComponent } from "../components/status-effect/status-effect-component";
import { OwnerComponent } from "../components/owner-component";
import { ActorTranslateComponent } from "../components/movement/actor-translate-component";
import { AnimationActorComponent } from "../components/animation/animation-actor-component";
import {
  getGameObjectBounds,
  getGameObjectLogicalTransform,
  getGameObjectVisibility,
  onObjectReady
} from "../../data/game-object-helper";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { AudioService } from "../../world/services/audio.service";
import { AoeZoneManager } from "./aoe-zone-manager";
import { NavigationService } from "../../world/services/navigation.service";
import { SceneActorCreator } from "../../world/services/scene-actor-creator";
import { DistanceHelper } from "../../library/distance-helper";
import FrostBolt from "../../prefabs/weapons/FrostBolt";
import { ProjectileType } from "../components/combat/projectile-type";
import { DepthHelper } from "../../world/services/depth.helper";
import { IsoHelper } from "../../world/tilemap/iso-helper";
import Phaser from "phaser";

export class SpellCastingSystem {
  private spellComponent?: SpellComponent;
  private actorTranslateComponent?: ActorTranslateComponent;
  private animationActorComponent?: AnimationActorComponent;
  private ownerComponent?: OwnerComponent;
  private audioService?: AudioService;
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

    // Play cast sound
    if (this.audioService && spellData.sounds?.cast) {
      // TODO: Play cast sound
    }

    // Spawn projectile or apply effects immediately
    if (spellData.projectile) {
      this.spawnProjectile(spellData, targetTileXYZ);
    } else {
      // Instant cast - apply effects immediately
      this.applySpellEffects(spellData, targetTileXYZ);
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
    let projectileSprite: Phaser.GameObjects.Image | undefined;

    switch (projectile.type) {
      case ProjectileType.FrostBoltProjectile:
      case ProjectileType.SnowstormProjectile:
        projectileSprite = new FrostBolt(this.gameObject.scene);
        break;
      default:
        projectileSprite = new FrostBolt(this.gameObject.scene); // Default to frost bolt
        break;
    }

    if (!projectileSprite) return;

    this.projectileSprite = projectileSprite;
    this.gameObject.scene.add.existing(projectileSprite);
    projectileSprite.setPosition(position.centerX, position.centerY);
    projectileSprite.setOrigin(0.5, 0.5);
    DepthHelper.setActorDepth(this.gameObject);

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
      ease: "Linear",
      onComplete: () => {
        this.onProjectileImpact(spellData, targetPosition, targetWorld);
        this.stopProjectile();
      }
    });
  }

  private onProjectileImpact(
    spellData: SpellData,
    targetTilePosition: Vector2Simple,
    targetWorldPosition: Vector2Simple
  ): void {
    // Play impact animation
    if (spellData.projectile?.impactAnimation) {
      // TODO: Create impact animation at target position
    }

    // Play impact sound
    if (this.audioService && spellData.sounds?.impact) {
      // TODO: Play impact sound
    }

    // Apply spell effects
    this.applySpellEffects(spellData, targetTilePosition);
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
      case 1: // Fire
        return StatusEffectType.Burning;
      case 3: // Poison
        return StatusEffectType.Poisoned;
      default:
        return StatusEffectType.Burning;
    }
  }

  private getStunEffectType(spellData: SpellData): StatusEffectType {
    // Frost spells use Frozen, others use Stunned
    if (spellData.damageType === 1) {
      // Frost
      return StatusEffectType.Frozen;
    }
    return StatusEffectType.Stunned;
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

    // Create actor definition
    const actorDefinition: ActorDefinition = {
      actorName: spellData.spawnPrefab.prefabName,
      representable: {
        logicalWorldTransform: {
          x: worldPosition.x,
          y: worldPosition.y,
          z: 0
        }
      },
      ...(spellData.spawnPrefab.inheritOwner &&
        this.ownerComponent && {
          owner: {
            ownerId: this.ownerComponent.getOwner()
          }
        }),
      constructionSite: {
        state: ConstructionStateEnum.Finished
      }
    };

    // Spawn the prefab
    const newGameObject = sceneActorCreator.createActorFromDefinition(actorDefinition);
    if (newGameObject) {
      // Hide by default - fog-of-war will show it if visible for player
      const visibilityComponent = getGameObjectVisibility(newGameObject);
      if (visibilityComponent) {
        visibilityComponent.setVisible(false);
      }

      // If the prefab has a duration, schedule its destruction
      if (spellData.spawnPrefab.duration) {
        this.gameObject.scene.time.delayedCall(spellData.spawnPrefab.duration, () => {
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
