import { type AttackData } from "../attack-data";
import { HealthComponent } from "./health-component";
import { getActorComponent } from "../../../../data/actor-component";
import { AnimationActorComponent } from "../../animation/animation-actor-component";
import { getHighGroundRangeBonus } from "../high-ground.helper";
import {
  getGameObjectBounds,
  getGameObjectDepth,
  getGameObjectVisibility,
  onObjectReady
} from "../../../../data/game-object-helper";
import { OrderType } from "../../../../ai/order-type";
import { ActorTranslateComponent } from "../../movement/actor-translate-component";
import { getSceneService } from "../../../../world/services/scene-component-helpers";
import { AudioService } from "../../../../world/services/audio.service";
import { DepthHelper } from "../../../../world/services/depth.helper";
import SlingshotRock from "../../../../prefabs/weapons/SlingshotRock";
import Arrow from "../../../../prefabs/weapons/Arrow";
import FireBall from "../../../../prefabs/weapons/FireBall";
import FrostBolt from "../../../../prefabs/weapons/FrostBolt";
import { DistanceHelper } from "../../../../library/distance-helper";
import { EffectsAnims } from "../../../../animations/effects";
import SkaduweeOwlFurball from "../../../../prefabs/weapons/SkaduweeOwlFurball";
import { FlyingComponent } from "../../movement/flying-component";
import { type AttackComponentData } from "@fuzzy-waddle/api-interfaces";
import { ProjectileType } from "../projectile-type";
import type { AnimationOptions } from "../../animation/animation-options";
import type { ProjectileData } from "../projectile-data";
import type { AttackDefinition } from "./attack-definition";
import GameObject = Phaser.GameObjects.GameObject;
import TivaraAlchemistVase from "../../../../prefabs/weapons/TivaraAlchemistVase";

export class AttackComponent {
  remainingCooldown = 0;
  private animationActorComponent?: AnimationActorComponent;
  private actorTranslateComponent?: ActorTranslateComponent;
  private audioService?: AudioService;
  private projectileTween?: Phaser.Tweens.Tween;
  private rotationTween?: Phaser.Tweens.Tween;
  currentAttack: AttackData | null = null;
  private projectileSprite?: Phaser.GameObjects.Image;
  // track delayed fire so we can cancel before projectile spawns
  private fireTimer?: Phaser.Time.TimerEvent;

  private attackDefinition: AttackDefinition;

  constructor(
    private readonly gameObject: GameObject,
    initialAttackDefinition: AttackDefinition
  ) {
    this.attackDefinition = {
      ...initialAttackDefinition
    };
    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
    onObjectReady(this.gameObject, this.init, this);
  }

  private init() {
    this.actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    this.animationActorComponent = getActorComponent(this.gameObject, AnimationActorComponent);
    this.audioService = getSceneService(this.gameObject.scene, AudioService);
  }

  private destroy() {
    this.gameObject.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.gameObject.off(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    this.gameObject.off(HealthComponent.KilledEvent, this.destroy, this);
    // cancel pending spawn timer (if any)
    if (this.fireTimer) {
      this.fireTimer.remove(false);
      this.fireTimer = undefined;
    }
    this.stopProjectile();
  }

  private update(_: number, delta: number): void {
    const deltaWithTimeScale = delta * this.gameObject.scene.time.timeScale;
    if (this.remainingCooldown <= 0) {
      return;
    }
    this.remainingCooldown -= deltaWithTimeScale;

    this.remainingCooldown = Math.max(this.remainingCooldown, 0);
    // if (this.remainingCooldown <= 0) {
    //   this.onCooldownReady.emit(this.gameObject);
    // }
  }

  /**
   * Determine if target is a flying unit
   * @param target The target to check
   * @returns Whether the target is flying or not
   */
  private isTargetFlying(target: GameObject): boolean {
    return !!getActorComponent(target, FlyingComponent);
  }

  /**
   * Gets the best attack for a specific enemy based on various criteria
   * including whether the enemy is flying and attack range
   */
  getAttack(enemy: GameObject): AttackData | null {
    const attacks = this.getAttacks();
    if (attacks.length === 0) return null;

    const distance = DistanceHelper.getTileDistanceBetweenGameObjects(this.gameObject, enemy);
    if (distance === null) return null;

    const isFlying = this.isTargetFlying(enemy);

    // Filter attacks based on:
    // 1. Range - attack can reach the target
    // 2. Flying capability - if target is flying, we need weapons that can focus air targets
    const availableAttacks = attacks
      .filter((attack) => {
        // Check if target is in range
        // const inRange = distance <= attack.range && distance >= attack.minRange;

        // Check if we can hit flying targets if target is flying
        // noinspection UnnecessaryLocalVariableJS
        const canHitTarget = !isFlying || attack.canTargetAir;

        return /*inRange &&*/ canHitTarget;
      })
      .sort((a, b) => {
        // Sort by damage (highest first)
        return b.damage - a.damage;
      });

    if (availableAttacks.length === 0) return null;
    return availableAttacks[0]!;
  }

  useAttack(enemy: GameObject) {
    if (this.remainingCooldown > 0) {
      return;
    }

    // Get appropriate attack based on enemy type (flying/ground) and range
    const attack = this.getAttack(enemy);
    if (!attack) return;
    this.currentAttack = attack;

    if (attack.projectile) {
      this.spawnProjectileAndFire(attack, enemy);
    } else {
      const enemyHealthComponent = getActorComponent(enemy, HealthComponent);
      if (!enemyHealthComponent) return;
      enemyHealthComponent.takeDamage(attack.damage, attack.damageType, this.gameObject);

      this.playSharedAttackLogic(attack, enemy);
    }

    this.remainingCooldown = attack.cooldown;
  }

  private playSharedAttackLogic(attack: AttackData, enemy: GameObject) {
    if (this.actorTranslateComponent) this.actorTranslateComponent.turnTowardsGameObject(enemy);
    if (this.animationActorComponent)
      this.animationActorComponent.playOrderAnimation(OrderType.Attack, {
        forceRestart: true
      } satisfies AnimationOptions);
    this.playAttackSound(attack, enemy);
  }

  private spawnProjectileAndFire(attack: AttackData, enemy: GameObject) {
    const projectile = attack.projectile;
    if (!projectile) return;
    if (!this.actorTranslateComponent) return;
    const targetPosition = getGameObjectBounds(enemy);
    if (!targetPosition) return;
    const position = getGameObjectBounds(this.gameObject);
    if (!position) return;

    this.playSharedAttackLogic(attack, enemy);

    // schedule projectile spawn; keep a reference so Stop can cancel it
    this.fireTimer = this.gameObject.scene.time.delayedCall(attack.delays.fire, () => {
      // clear timer reference when it fires
      this.fireTimer = undefined;

      if (!this.gameObject.active || !enemy.active) return;
      const healthComponent = getActorComponent(this.gameObject, HealthComponent);
      if (!healthComponent || healthComponent.killed) return;
      const enemyHealthComponent = getActorComponent(enemy, HealthComponent);
      if (!enemyHealthComponent || enemyHealthComponent.killed) return;

      let projectileSprite;
      switch (projectile.type) {
        case ProjectileType.SlingshotProjectile:
          projectileSprite = new SlingshotRock(this.gameObject.scene);
          break;
        case ProjectileType.ArrowProjectile:
          projectileSprite = new Arrow(this.gameObject.scene);
          break;
        case ProjectileType.FireballProjectile:
          projectileSprite = new FireBall(this.gameObject.scene);
          break;
        case ProjectileType.FurballProjectile:
          projectileSprite = new SkaduweeOwlFurball(this.gameObject.scene);
          break;
        case ProjectileType.VaseProjectile:
          projectileSprite = new TivaraAlchemistVase(this.gameObject.scene);
          break;
        case ProjectileType.FrostBoltProjectile:
          projectileSprite = new FrostBolt(this.gameObject.scene);
          break;
        default:
          console.error("Unknown projectile type", projectile.type);
          return;
      }
      this.projectileSprite = projectileSprite;
      this.gameObject.scene.add.existing(projectileSprite);
      projectileSprite.setPosition(position.centerX, position.centerY);
      projectileSprite.setOrigin(0.5, 0.5);
      DepthHelper.setActorDepth(this.gameObject);

      const projectileSpeed = projectile.speed;
      const targetX = targetPosition.x + targetPosition.width / 2;
      const targetY = targetPosition.y + targetPosition.height / 2;
      const distance = Phaser.Math.Distance.Between(position.x, position.y, targetX, targetY);
      const duration = (distance / projectileSpeed) * 1000; // convert to milliseconds

      if (!projectile.orientation.randomizeOrientation) {
        const currentAngle = Phaser.Math.Angle.Between(position.x, position.y, targetX, targetY);
        projectileSprite.setRotation(currentAngle);
      }

      this.projectileTween = this.gameObject.scene.tweens.add({
        targets: projectileSprite,
        x: targetX,
        y: targetY,
        duration: duration,
        ease: "Linear",
        onComplete: () => this.stopProjectile(),
        onUpdate: () => {
          if (!this.gameObject.active || !enemy.active) return;
          // compare overlap of projectile and enemy
          const projectileBounds = getGameObjectBounds(projectileSprite);
          if (!projectileBounds) return;
          const enemyBounds = getGameObjectBounds(enemy);
          if (!enemyBounds) return;
          const intersection = Phaser.Geom.Intersects.RectangleToRectangle(projectileBounds, enemyBounds);
          if (intersection) {
            // we hit
            this.projectileHitEnemy(projectile, targetX, targetY, attack, enemy);
          }
        }
      });

      // spin projectile
      if (projectile.orientation.randomizeOrientation && projectile.orientation.rotationSpeed) {
        this.rotationTween = this.gameObject.scene.tweens.add({
          targets: projectileSprite,
          angle: 360,
          duration: projectile.orientation.rotationSpeed,
          repeat: -1
        });
      }
    });
  }

  private projectileHitEnemy(
    projectile: ProjectileData,
    targetX: number,
    targetY: number,
    attack: AttackData,
    enemy: GameObject
  ) {
    const enemyHealthComponent = getActorComponent(enemy, HealthComponent);
    if (!enemyHealthComponent || enemyHealthComponent.killed) return;
    enemyHealthComponent.takeDamage(attack.damage, attack.damageType, this.gameObject);

    // play hit sound
    if (this.audioService && attack.sounds.hit) {
      const visibilityComponent = getGameObjectVisibility(this.gameObject);
      if (visibilityComponent && visibilityComponent.visible) {
        // can be random as it doesn't need to be deterministic
        const randomHitSound = attack.sounds.hit[Math.floor(Math.random() * attack.sounds.hit.length)]!;
        this.audioService.playSpatialAudioSprite(
          enemy, // enemy hit position
          randomHitSound.key,
          randomHitSound.spriteName
        );
      }
    }
    this.stopProjectile();
    if (projectile.impactAnimation) {
      const anims = projectile.impactAnimation.anims;
      // can be random as it's just visual effect
      const randomImpactAnim = anims[Math.floor(Math.random() * anims.length)]!;
      const impactSprite = EffectsAnims.createAndPlayEffectAnimation(
        this.gameObject.scene,
        randomImpactAnim,
        targetX,
        targetY
      );
      const depth = getGameObjectDepth(enemy);
      if (depth !== null) impactSprite.setDepth(depth + 1);
      if (projectile.impactAnimation.tint) impactSprite.setTint(projectile.impactAnimation.tint);
    }
  }

  private stopProjectile() {
    if (this.projectileTween) {
      this.projectileTween.stop();
      this.projectileTween = undefined;
    }
    if (this.rotationTween) {
      this.rotationTween.stop();
      this.rotationTween = undefined;
    }
    this.projectileSprite?.destroy();
    this.projectileSprite = undefined;
  }

  /**
   * Cancel any ongoing attack scheduling
   * - If projectile hasn't spawned yet, cancel delayed spawn so no projectile or hit logic runs.
   * - If projectile has already spawned and is travelling, do NOT cancel it.
   * Does not modify cooldowns.
   */
  public cancelCurrentAttack(): void {
    // cancel only pre-spawn scheduling
    if (!this.projectileSprite && this.fireTimer) {
      this.fireTimer.remove(false);
      this.fireTimer = undefined;
    }
    // do not call stopProjectile here if projectile is already travelling
  }

  // gameObject will automatically select and attack targets
  getAcquisitionRadius(): number {
    // todo
    return 0;
  }

  getChaseRadius(): number {
    // todo
    return 0;
  }

  // Different attacks might be used at different ranges, or against different types of targets
  getAttacks(): AttackData[] {
    return this.attackDefinition.attacks;
  }

  // time till next attack
  getRemainingCooldown(attackIndex: number): number {
    // todo
    return 0;
  }

  getMaximumRange(targetGameObject?: GameObject): number {
    if (targetGameObject) {
      return Math.max(
        ...this.attackDefinition.attacks.map(
          (attack) => attack.range + getHighGroundRangeBonus(this.gameObject, targetGameObject, attack)
        )
      );
    }
    return Math.max(...this.attackDefinition.attacks.map((attack) => attack.range));
  }

  private playAttackSound(attack: AttackData, enemy: GameObject) {
    if (!this.audioService) return;
    const { preparing, fire, hit } = attack.sounds;
    if (preparing) {
      const visibilityComponent = getGameObjectVisibility(this.gameObject);
      if (visibilityComponent && visibilityComponent.visible) {
        // can be random as it doesn't need to be deterministic
        const randomPreparingSound = preparing[Math.floor(Math.random() * preparing.length)]!;
        this.audioService.playSpatialAudioSprite(
          this.gameObject,
          randomPreparingSound.key,
          randomPreparingSound.spriteName
        );
      }
    }
    this.gameObject.scene.time.delayedCall(attack.delays.fire, () => {
      if (fire) {
        const visibilityComponent = getGameObjectVisibility(this.gameObject);
        if (visibilityComponent && visibilityComponent.visible) {
          // can be random as it doesn't need to be deterministic
          const randomFireSound = fire[Math.floor(Math.random() * fire.length)]!;
          this.audioService!.playSpatialAudioSprite(this.gameObject, randomFireSound.key, randomFireSound.spriteName);
        }
      }
    });

    if (!attack.projectile) {
      // if not a projectile, play hit sound
      this.gameObject.scene.time.delayedCall(attack.delays.hit, () => {
        if (hit) {
          const visibilityComponent = getGameObjectVisibility(this.gameObject);
          if (visibilityComponent && visibilityComponent.visible) {
            // can be random as it doesn't need to be deterministic
            const randomHitSound = hit[Math.floor(Math.random() * hit.length)]!;
            this.audioService!.playSpatialAudioSprite(
              enemy, // enemy hit position
              randomHitSound.key,
              randomHitSound.spriteName
            );
          }
        }
      });
    }
  }

  /**
   * Returns the optimal attack range for a specific target, including high ground bonus.
   * For flying targets, returns the effective horizontal range needed so that
   * the 3D distance (including vertical height) equals the attack range.
   * This is useful for AI to position units at the right distance.
   */
  getAttackRange(targetGameObject: GameObject): number | undefined {
    if (!targetGameObject) return undefined;

    const isFlying = this.isTargetFlying(targetGameObject);
    const attacks = this.getAttacks();

    // Filter attacks that can hit the target type (flying/ground)
    const availableAttacks = attacks.filter((attack) => !isFlying || attack.canTargetAir);

    if (availableAttacks.length === 0) return undefined;

    // Sort by damage (highest first) and then by effective range (prefer longer range)
    availableAttacks.sort((a, b) => {
      // Prioritize damage first
      const damageDiff = b.damage - a.damage;
      if (damageDiff !== 0) return damageDiff;

      // If damage is the same, prefer longer effective range (including high ground bonus)
      const aEffectiveRange = a.range + getHighGroundRangeBonus(this.gameObject, targetGameObject, a);
      const bEffectiveRange = b.range + getHighGroundRangeBonus(this.gameObject, targetGameObject, b);
      return bEffectiveRange - aEffectiveRange;
    });

    // Return the effective range of the best attack (base range + high ground bonus)
    const bestAttack = availableAttacks[0]!;
    const attackRangeWithHighGroundBonus =
      bestAttack.range + getHighGroundRangeBonus(this.gameObject, targetGameObject, bestAttack);

    // For flying targets, calculate the effective horizontal range
    // so that ground units stop at the correct distance
    if (isFlying) {
      // noinspection UnnecessaryLocalVariableJS
      const distanceForFlyingTargets = DistanceHelper.getEffectiveHorizontalRangeForFlyingTargetInTiles(
        attackRangeWithHighGroundBonus,
        targetGameObject
      );
      return distanceForFlyingTargets;
    }

    return attackRangeWithHighGroundBonus;
  }

  setData(data: Partial<AttackComponentData> & Partial<AttackDefinition>) {
    // Update runtime state
    if (data.remainingCooldown !== undefined) this.remainingCooldown = data.remainingCooldown;
    if (data.currentAttackIndex !== undefined) {
      const idx = data.currentAttackIndex;
      if (idx === null || idx === undefined) {
        this.currentAttack = null;
      } else if (idx >= 0 && idx < this.attackDefinition.attacks.length) {
        this.currentAttack = this.attackDefinition.attacks[idx]!;
      }
    }

    // Update definition (for level upgrades)
    if (data.attacks !== undefined) {
      this.attackDefinition.attacks = data.attacks;
      // Reset current attack if it's out of bounds
      if (this.currentAttack && !this.attackDefinition.attacks.includes(this.currentAttack)) {
        this.currentAttack = null;
      }
    }
  }

  getData(): AttackComponentData {
    const currentAttackIndex = this.currentAttack
      ? this.attackDefinition.attacks.indexOf(this.currentAttack)
      : undefined;
    return {
      remainingCooldown: this.remainingCooldown,
      currentAttackIndex
    };
  }
}
