import { AttackData } from "../attack-data";
import { EventEmitter } from "@angular/core";
import { HealthComponent } from "./health-component";
import { getActorComponent } from "../../../data/actor-component";
import GameObject = Phaser.GameObjects.GameObject;

export type AttackDefinition = {
  attacks: AttackData[];
};

export class AttackComponent {
  // when cooldown has expired
  onCooldownReady: EventEmitter<GameObject> = new EventEmitter<GameObject>();
  // gameObject used an attack
  onAttackUsed: EventEmitter<AttackData> = new EventEmitter<AttackData>();
  remainingCooldown = 0;

  constructor(
    private readonly owner: GameObject,
    private readonly attackDefinition: AttackDefinition
  ) {
    owner.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    owner.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
  }

  private destroy() {
    this.owner.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
  }
  private update(time: number, delta: number): void {
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
    if (attackIndex >= this.attackDefinition.attacks.length) {
      throw new Error("Invalid attack index");
    }

    const attack = this.attackDefinition.attacks[attackIndex];

    if (attack.projectileType) {
      // todo   const projectile = new attack.projectileClass(this.owner.scene, this.owner); // todo here it should be getWorld.SpawnGameObject<ProjectileClass>(attack.projectileClass, transform, spawnInfo)
      // todo   projectile.registerGameObject(); // todo should be called by registration engine
      // todo   projectile.fireAtGameObject(enemy);
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
    return this.attackDefinition.attacks;
  }

  // time till next attack
  getRemainingCooldown(attackIndex: number): number {
    // todo
    return 0;
  }
}
