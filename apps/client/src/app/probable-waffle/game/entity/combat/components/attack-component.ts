import { AttackData, ProjectileData, ProjectileType } from "../attack-data";
import { HealthComponent } from "./health-component";
import { getActorComponent } from "../../../data/actor-component";
import { AnimationActorComponent } from "../../actor/components/animation-actor-component";
import { getGameObjectBounds, getGameObjectDepth, onObjectReady } from "../../../data/game-object-helper";
import { OrderType } from "../../character/ai/order-type";
import { ActorTranslateComponent } from "../../actor/components/actor-translate-component";
import { getSceneService } from "../../../scenes/components/scene-component-helpers";
import { AudioService } from "../../../scenes/services/audio.service";
import { DepthHelper } from "../../../world/map/depth.helper";
import SlingshotRock from "../../../prefabs/weapons/SlingshotRock";
import Arrow from "../../../prefabs/weapons/Arrow";
import FireBall from "../../../prefabs/weapons/FireBall";
import FrostBolt from "../../../prefabs/weapons/FrostBolt";
import { GameplayLibrary } from "../../../library/gameplay-library";
import { EffectsAnims } from "../../../animations/effects";
import GameObject = Phaser.GameObjects.GameObject;

export type AttackDefinition = {
  attacks: AttackData[];
};

export class AttackComponent {
  remainingCooldown = 0;
  private animationActorComponent?: AnimationActorComponent;
  private actorTranslateComponent?: ActorTranslateComponent;
  private audioService?: AudioService;
  private projectileTween?: Phaser.Tweens.Tween;
  currentAttack: AttackData | null = null;

  constructor(
    private readonly gameObject: GameObject,
    private readonly attackDefinition: AttackDefinition
  ) {
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
    this.gameObject.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.gameObject.off(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    this.gameObject.off(HealthComponent.KilledEvent, this.destroy, this);
    this.stopProjectileTween();
  }

  private update(_: number, delta: number): void {
    if (this.remainingCooldown <= 0) {
      return;
    }
    this.remainingCooldown -= delta;
    this.remainingCooldown = Math.max(this.remainingCooldown, 0);
    // if (this.remainingCooldown <= 0) {
    //   this.onCooldownReady.emit(this.gameObject);
    // }
  }

  getAttack(enemy: GameObject): AttackData | null {
    const attacks = this.getAttacks();
    // get random
    if (attacks.length === 0) return null;

    const distance = GameplayLibrary.getTileDistanceBetweenGameObjects(this.gameObject, enemy);
    if (distance === null) return null;
    const filteredAttacks = attacks
      // .filter((attack) => { // here we can limit also by min range - but then behavior tree neds to also be changed
      //   return distance >= attack.minRange;
      // })
      .sort(
        (a, b) =>
          // sort by damage
          b.damage - a.damage
      );

    if (attacks.length === 0) return null;
    return filteredAttacks[0];
  }

  useAttack(enemy: GameObject) {
    if (this.remainingCooldown > 0) {
      return;
    }

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
    if (this.animationActorComponent) this.animationActorComponent.playOrderAnimation(OrderType.Attack, true);
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

    setTimeout(() => {
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
        case ProjectileType.FrostBoltProjectile:
          projectileSprite = new FrostBolt(this.gameObject.scene);
          break;
        default:
          console.error("Unknown projectile type", projectile.type);
          return;
      }
      this.gameObject.scene.add.existing(projectileSprite);
      projectileSprite.setPosition(position.centerX, position.centerY);
      projectileSprite.setOrigin(0.5, 0.5);
      const gameObjectDepth = getGameObjectDepth(this.gameObject);
      if (gameObjectDepth !== null) DepthHelper.setActorDepth(gameObjectDepth + 1);

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
        onComplete: () => {
          if (projectileSprite.active) projectileSprite.destroy();
        },
        onUpdate: () => {
          // compare overlap of projectile and enemy
          const projectileBounds = getGameObjectBounds(projectileSprite);
          if (!projectileBounds) return;
          const enemyBounds = getGameObjectBounds(enemy);
          if (!enemyBounds) return;
          const intersection = Phaser.Geom.Intersects.RectangleToRectangle(projectileBounds, enemyBounds);
          if (intersection) {
            // we hit
            this.projectileHitEnemy(projectile, targetX, targetY, projectileSprite, attack, enemy);
          }
        }
      });
    }, attack.delays.fire);
  }

  private projectileHitEnemy(
    projectile: ProjectileData,
    targetX: number,
    targetY: number,
    projectileSprite: Phaser.GameObjects.Image,
    attack: AttackData,
    enemy: GameObject
  ) {
    const enemyHealthComponent = getActorComponent(enemy, HealthComponent);
    if (!enemyHealthComponent || enemyHealthComponent.killed) return;
    enemyHealthComponent.takeDamage(attack.damage, attack.damageType, this.gameObject);

    // play hit sound
    if (this.audioService && attack.sounds.hit) {
      const randomHitSound = attack.sounds.hit[Math.floor(Math.random() * attack.sounds.hit.length)];
      this.audioService.playSpatialAudioSprite(
        enemy, // enemy hit position
        randomHitSound.key,
        randomHitSound.spriteName
      );
    }
    projectileSprite.destroy();
    this.stopProjectileTween();
    if (projectile.impactAnimation) {
      const anims = projectile.impactAnimation.anims;
      const randomImpactAnim = anims[Math.floor(Math.random() * anims.length)];
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

  private stopProjectileTween() {
    if (this.projectileTween) {
      this.projectileTween.stop();
      this.projectileTween = undefined;
    }
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

  getMaximumRange(): number {
    return Math.max(...this.attackDefinition.attacks.map((attack) => attack.range));
  }

  private playAttackSound(attack: AttackData, enemy: GameObject) {
    if (!this.audioService) return;
    const { preparing, fire, hit } = attack.sounds;
    if (preparing) {
      const randomPreparingSound = preparing[Math.floor(Math.random() * preparing.length)];
      this.audioService.playSpatialAudioSprite(
        this.gameObject,
        randomPreparingSound.key,
        randomPreparingSound.spriteName
      );
    }
    setTimeout(() => {
      if (fire) {
        const randomFireSound = fire[Math.floor(Math.random() * fire.length)];
        this.audioService!.playSpatialAudioSprite(this.gameObject, randomFireSound.key, randomFireSound.spriteName);
      }
    }, attack.delays.fire);

    if (!attack.projectile) {
      // if not a projectile, play hit sound
      setTimeout(() => {
        if (hit) {
          const randomHitSound = hit[Math.floor(Math.random() * hit.length)];
          this.audioService!.playSpatialAudioSprite(
            enemy, // enemy hit position
            randomHitSound.key,
            randomHitSound.spriteName
          );
        }
      }, attack.delays.hit);
    }
  }
}
