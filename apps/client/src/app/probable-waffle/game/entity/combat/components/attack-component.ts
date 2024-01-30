import { AttackData } from "../attack-data";
import { EventEmitter } from "@angular/core";
import { HealthComponent } from "./health-component";
import GameObject = Phaser.GameObjects.GameObject;
import { getActorComponent } from "../../../data/actor-component";

export class AttackComponent {
  // when cooldown has expired
  onCooldownReady: EventEmitter<GameObject> = new EventEmitter<GameObject>();
  // gameObject used an attack
  onAttackUsed: EventEmitter<AttackData> = new EventEmitter<AttackData>();
  remainingCooldown = 0;

  constructor(
    private owner: GameObject,
    private attacks: AttackData[]
  ) {}

  update(time: number, delta: number): void {
    if (this.remainingCooldown <= 0) {
      return;
    }
    this.remainingCooldown -= delta;
    if (this.remainingCooldown <= 0) {
      this.onCooldownReady.emit(this.owner);
    }
  }

  useAttack(attackIndex: number, enemy: GameObject) {
    if (this.remainingCooldown > 0) {
      return;
    }
    if (attackIndex >= this.attacks.length) {
      throw new Error("Invalid attack index");
    }

    const attack = this.attacks[attackIndex];

    if (attack.projectileClass) {
      const projectile = new attack.projectileClass(this.owner.scene, this.owner); // todo here it should be getWorld.SpawnGameObject<ProjectileClass>(attack.projectileClass, transform, spawnInfo)
      projectile.registerGameObject(); // todo should be called by registration engine
      projectile.fireAtGameObject(enemy);
    } else {
      const enemyHealthComponent = getActorComponent(enemy, HealthComponent);
      if (!enemyHealthComponent) {
        throw new Error("Enemy does not have HealthComponent");
      }
      enemyHealthComponent.takeDamage(attack.damage, attack.damageType, this.owner);
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
    return this.attacks;
  }

  // time till next attack
  getRemainingCooldown(attackIndex: number): number {
    // todo
    return 0;
  }
}
