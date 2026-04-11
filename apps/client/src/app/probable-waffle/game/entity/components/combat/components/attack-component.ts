import { type AttackData } from "../attack-data";
import { HealthComponent } from "./health-component";
import { getActorComponent } from "../../../../data/actor-component";
import { AnimationActorComponent } from "../../animation/animation-actor-component";
import { getHighGroundRangeBonus } from "../high-ground.helper";
import {
  getGameObjectBounds,
  getGameObjectDepth,
  getGameObjectLogicalTransform,
  getGameObjectVisibility,
  onObjectReady
} from "../../../../data/game-object-helper";
import { OrderType } from "../../../../ai/order-type";
import { ActorTranslateComponent } from "../../movement/actor-translate-component";
import { getSceneService } from "../../../../world/services/scene-component-helpers";
import { AudioService } from "../../../../world/services/audio.service";
import { DepthHelper } from "../../../../world/services/depth.helper";
import { ActorIndexSystem } from "../../../../world/services/ActorIndexSystem";
import SlingshotRock from "../../../../prefabs/weapons/SlingshotRock";
import Arrow from "../../../../prefabs/weapons/Arrow";
import FireArrow from "../../../../prefabs/weapons/FireArrow";
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
import type { IsoDirection } from "../../movement/iso-directions";
import { TilemapComponent } from "../../../../world/tilemap/tilemap.component";
import TivaraAlchemistVase from "../../../../prefabs/weapons/TivaraAlchemistVase";
import GameObject = Phaser.GameObjects.GameObject;

export class AttackComponent {
  remainingCooldown = 0;
  private animationActorComponent?: AnimationActorComponent;
  private actorTranslateComponent?: ActorTranslateComponent;
  private audioService?: AudioService;
  private actorIndexSystem?: ActorIndexSystem;
  private projectileTween?: Phaser.Tweens.Tween;
  private rotationTween?: Phaser.Tweens.Tween;
  currentAttack: AttackData | null = null;
  private projectileSprite?: Phaser.GameObjects.Image;
  // track delayed fire so we can cancel before projectile spawns
  private fireTimer?: Phaser.Time.TimerEvent;
  private hitTimer?: Phaser.Time.TimerEvent;

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
    this.actorIndexSystem = getSceneService(this.gameObject.scene, ActorIndexSystem);
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
    if (this.hitTimer) {
      this.hitTimer.remove(false);
      this.hitTimer = undefined;
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
      this.playSharedAttackLogic(attack, enemy);
      this.scheduleInstantAttackImpact(attack, enemy);
    }

    this.remainingCooldown = attack.cooldown;
  }

  private applyInstantAttackDamage(attack: AttackData, enemy: GameObject) {
    const targets = this.getInstantAttackTargets(attack, enemy);
    if (targets.length === 0) return;

    for (const target of targets) {
      const targetHealthComponent = getActorComponent(target, HealthComponent);
      if (!targetHealthComponent || targetHealthComponent.killed) continue;
      targetHealthComponent.takeDamage(attack.damage, attack.damageType, this.gameObject);
    }
  }

  private scheduleInstantAttackImpact(attack: AttackData, enemy: GameObject) {
    if (this.hitTimer) {
      this.hitTimer.remove(false);
      this.hitTimer = undefined;
    }
    this.hitTimer = this.gameObject.scene.time.delayedCall(attack.delays.hit, () => {
      this.hitTimer = undefined;

      if (!this.gameObject.active || !enemy.active) return;
      const healthComponent = getActorComponent(this.gameObject, HealthComponent);
      if (!healthComponent || healthComponent.killed) return;

      this.playHitSound(attack, enemy);
      this.applyInstantAttackDamage(attack, enemy);
    });
  }

  private getInstantAttackTargets(attack: AttackData, enemy: GameObject): GameObject[] {
    const enemyHealthComponent = getActorComponent(enemy, HealthComponent);
    if (!enemyHealthComponent || enemyHealthComponent.killed) return [];
    if (!attack.meleeAoe) return [enemy];
    if (!this.actorIndexSystem) return [enemy];

    const attackerTransform = getGameObjectLogicalTransform(this.gameObject);
    if (!attackerTransform) return [enemy];

    this.actorTranslateComponent?.turnTowardsGameObject(enemy);

    const facingVector = this.getFacingVector(attackerTransform, enemy);
    if (!facingVector) return [enemy];

    const halfAngleRadians = Phaser.Math.DegToRad(attack.meleeAoe.angleDegrees / 2);
    const minimumDotProduct = Math.cos(halfAngleRadians);
    const aoeRangePixels = attack.meleeAoe.range * TilemapComponent.tileWidth;
    const targets: GameObject[] = [];

    for (const candidate of this.actorIndexSystem.getEnemyCandidates(this.gameObject)) {
      if (!attack.canTargetAir && this.isTargetFlying(candidate)) continue;

      const candidateHealthComponent = getActorComponent(candidate, HealthComponent);
      if (!candidateHealthComponent || candidateHealthComponent.killed) continue;

      const candidateTransform = getGameObjectLogicalTransform(candidate);
      if (!candidateTransform) continue;

      const offsetX = candidateTransform.x - attackerTransform.x;
      const offsetY = candidateTransform.y - attackerTransform.y;
      const distance = Math.hypot(offsetX, offsetY);
      if (distance === 0 || distance > aoeRangePixels) continue;

      const dotProduct = (offsetX * facingVector.x + offsetY * facingVector.y) / distance;
      if (dotProduct < minimumDotProduct) continue;

      targets.push(candidate);
    }

    return targets.length > 0 ? targets : [enemy];
  }

  private getFacingVector(
    attackerTransform: { x: number; y: number },
    enemy: GameObject
  ): { x: number; y: number } | null {
    const currentDirection = this.actorTranslateComponent?.currentDirection;
    if (currentDirection) {
      return this.getFacingVectorFromDirection(currentDirection);
    }

    const enemyTransform = getGameObjectLogicalTransform(enemy);
    if (!enemyTransform) return null;

    const directionX = enemyTransform.x - attackerTransform.x;
    const directionY = enemyTransform.y - attackerTransform.y;
    const distance = Math.hypot(directionX, directionY);
    if (distance === 0) return null;

    return {
      x: directionX / distance,
      y: directionY / distance
    };
  }

  private getFacingVectorFromDirection(direction: IsoDirection): { x: number; y: number } {
    let directionVector: { x: number; y: number };

    switch (direction) {
      case "north":
        directionVector = { x: 0, y: -1 };
        break;
      case "south":
        directionVector = { x: 0, y: 1 };
        break;
      case "east":
        directionVector = { x: 1, y: 0 };
        break;
      case "west":
        directionVector = { x: -1, y: 0 };
        break;
      case "northeast":
        directionVector = { x: 1, y: -0.5 };
        break;
      case "northwest":
        directionVector = { x: -1, y: -0.5 };
        break;
      case "southeast":
        directionVector = { x: 1, y: 0.5 };
        break;
      case "southwest":
        directionVector = { x: -1, y: 0.5 };
        break;
    }

    const magnitude = Math.hypot(directionVector.x, directionVector.y);
    return {
      x: directionVector.x / magnitude,
      y: directionVector.y / magnitude
    };
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

      const targetX = targetPosition.x + targetPosition.width / 2;
      const targetY = targetPosition.y + targetPosition.height / 2;
      const baseStartX = position.centerX;
      const baseStartY = position.centerY;

      const salvoCount = projectile.salvo?.count ?? 1;
      const spreadPx = projectile.salvo?.spreadPx ?? 0;

      for (let i = 0; i < salvoCount; i++) {
        // Distribute origins evenly across the hull width
        const t = salvoCount > 1 ? i / (salvoCount - 1) : 0.5;
        const offsetX = spreadPx > 0 ? (t - 0.5) * spreadPx : 0;
        // Small stagger in Y to give a depth effect along the isometric hull
        const offsetY = offsetX * 0.3;
        this.spawnSingleProjectile(
          projectile,
          attack,
          enemy,
          baseStartX + offsetX,
          baseStartY + offsetY,
          targetX,
          targetY,
          i === 0 // only the first arrow is tracked for cancellation
        );
      }
    });
  }

  /** Spawns and animates a single projectile sprite. When `track` is true, stores references for cancellation. */
  private spawnSingleProjectile(
    projectile: ProjectileData,
    attack: AttackData,
    enemy: GameObject,
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    track: boolean
  ) {
    let projectileSprite;
    switch (projectile.type) {
      case ProjectileType.SlingshotProjectile:
        projectileSprite = new SlingshotRock(this.gameObject.scene);
        break;
      case ProjectileType.ArrowProjectile:
        projectileSprite = new Arrow(this.gameObject.scene);
        break;
      case ProjectileType.FireArrowProjectile:
        projectileSprite = new FireArrow(this.gameObject.scene);
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

    if (track) this.projectileSprite = projectileSprite;
    this.gameObject.scene.add.existing(projectileSprite);
    projectileSprite.setPosition(startX, startY);
    projectileSprite.setOrigin(0.5, 0.5);
    DepthHelper.setActorDepth(this.gameObject);

    const projectileSpeed = projectile.speed;
    const distance = Phaser.Math.Distance.Between(startX, startY, targetX, targetY);
    const duration = (distance / projectileSpeed) * 1000; // convert to milliseconds

    let rotationTween: Phaser.Tweens.Tween | undefined;
    let cleanedUp = false;
    let tween: Phaser.Tweens.Tween;

    const cleanupThis = () => {
      if (cleanedUp) return;
      cleanedUp = true;

      rotationTween?.stop();
      if (track && this.rotationTween === rotationTween) {
        this.rotationTween = undefined;
      }
      if (track && this.projectileTween === tween) {
        this.projectileTween = undefined;
      }
      if (track && this.projectileSprite === projectileSprite) {
        this.projectileSprite = undefined;
      }
      projectileSprite.destroy();
    };

    const stopThis = () => {
      if (cleanedUp) return;
      tween.stop();
      cleanupThis();
    };

    if (projectile.trajectoryType === "parabolic") {
      tween = this.spawnParabolicTween(
        projectileSprite,
        startX,
        startY,
        targetX,
        targetY,
        duration,
        projectile,
        attack,
        enemy,
        stopThis,
        cleanupThis
      );
    } else {
      if (!projectile.orientation.randomizeOrientation) {
        const currentAngle = Phaser.Math.Angle.Between(startX, startY, targetX, targetY);
        projectileSprite.setRotation(currentAngle);
      }

      tween = this.gameObject.scene.tweens.add({
        targets: projectileSprite,
        x: targetX,
        y: targetY,
        duration: duration,
        ease: "Linear",
        onComplete: cleanupThis,
        onUpdate: () => {
          if (!this.gameObject.active || !enemy.active) return;
          const projectileBounds = getGameObjectBounds(projectileSprite);
          if (!projectileBounds) return;
          const enemyBounds = getGameObjectBounds(enemy);
          if (!enemyBounds) return;
          if (Phaser.Geom.Intersects.RectangleToRectangle(projectileBounds, enemyBounds)) {
            this.projectileHitEnemy(projectile, targetX, targetY, attack, enemy, stopThis);
          }
        }
      });

      // spin projectile
      if (projectile.orientation.randomizeOrientation && projectile.orientation.rotationSpeed) {
        rotationTween = this.gameObject.scene.tweens.add({
          targets: projectileSprite,
          angle: 360,
          duration: projectile.orientation.rotationSpeed,
          repeat: -1
        });
        if (track) this.rotationTween = rotationTween;
      }
    }

    if (track) this.projectileTween = tween;
  }

  private spawnParabolicTween(
    projectileSprite: Phaser.GameObjects.Image,
    startX: number,
    startY: number,
    targetX: number,
    targetY: number,
    duration: number,
    projectile: ProjectileData,
    attack: AttackData,
    enemy: GameObject,
    stopFn: () => void = () => this.stopProjectile(),
    onCompleteFn: () => void = stopFn
  ): Phaser.Tweens.Tween {
    const peakHeight = projectile.parabolicPeakHeight ?? 120;
    let lastTrailTime = 0;

    return this.gameObject.scene.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      onUpdate: (tween) => {
        if (!this.gameObject.active || !enemy.active) return;
        const t = tween.getValue() ?? 0;
        const x = startX + (targetX - startX) * t;
        const arcOffset = -peakHeight * 4 * t * (1 - t);
        const y = startY + (targetY - startY) * t + arcOffset;
        projectileSprite.setPosition(x, y);

        // Rotate to match trajectory tangent
        const dx = targetX - startX;
        const dy = targetY - startY + peakHeight * 4 * (2 * t - 1);
        projectileSprite.setRotation(Math.atan2(dy, dx));

        // Cloud trail effect
        if (projectile.trailEffect) {
          const now = this.gameObject.scene.time.now;
          if (now - lastTrailTime > projectile.trailEffect.intervalMs) {
            lastTrailTime = now;
            const trail = this.gameObject.scene.add.image(
              x,
              y,
              projectile.trailEffect.key,
              projectile.trailEffect.frame
            );
            trail.setAlpha(0.6).setScale(0.5);
            this.gameObject.scene.tweens.add({
              targets: trail,
              alpha: 0,
              duration: 350,
              onComplete: () => trail.destroy()
            });
          }
        }

        // Hit detection
        const projectileBounds = getGameObjectBounds(projectileSprite);
        if (!projectileBounds) return;
        const enemyBounds = getGameObjectBounds(enemy);
        if (!enemyBounds) return;
        if (Phaser.Geom.Intersects.RectangleToRectangle(projectileBounds, enemyBounds)) {
          this.projectileHitEnemy(projectile, targetX, targetY, attack, enemy, stopFn);
        }
      },
      onComplete: () => onCompleteFn()
    });
  }

  private projectileHitEnemy(
    projectile: ProjectileData,
    targetX: number,
    targetY: number,
    attack: AttackData,
    enemy: GameObject,
    stopProjectile: () => void
  ) {
    const enemyHealthComponent = getActorComponent(enemy, HealthComponent);
    if (!enemyHealthComponent || enemyHealthComponent.killed) return;
    enemyHealthComponent.takeDamage(attack.damage, attack.damageType, this.gameObject);

    this.playHitSound(attack, enemy);
    stopProjectile();
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
    if (this.hitTimer) {
      this.hitTimer.remove(false);
      this.hitTimer = undefined;
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
    const { preparing, fire } = attack.sounds;
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
  }

  private playHitSound(attack: AttackData, enemy: GameObject) {
    if (!this.audioService) return;
    const hit = attack.sounds.hit;
    if (!hit) return;
    const visibilityComponent = getGameObjectVisibility(this.gameObject);
    if (!visibilityComponent || !visibilityComponent.visible) return;
    // can be random as it doesn't need to be deterministic
    const randomHitSound = hit[Math.floor(Math.random() * hit.length)]!;
    this.audioService.playSpatialAudioSprite(
      enemy, // enemy hit position
      randomHitSound.key,
      randomHitSound.spriteName
    );
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
