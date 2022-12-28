import { IComponent } from '../../services/component.service';
import { Actor } from '../../actor';
import { AttackData } from './attack-data';
import { EventEmitter } from '@angular/core';
import HealthComponent from './health-component';

export class AttackComponent implements IComponent {
  // when cooldown has expired
  onCooldownReady: EventEmitter<Actor> = new EventEmitter<Actor>();
  // actor used an attack
  onAttackUsed: EventEmitter<AttackData> = new EventEmitter<AttackData>();

  remainingCooldown = 0;
  constructor(private owner: Actor, private attacks: AttackData[]) {}

  init(): void {
    // pass
  }

  update(time: number, delta: number): void {
    if (this.remainingCooldown <= 0) {
      return;
    }
    this.remainingCooldown -= delta;
    if (this.remainingCooldown <= 0) {
      this.onCooldownReady.emit(this.owner);
    }
  }

  useAttack(attackIndex: number, enemy: Actor) {
    if (this.remainingCooldown > 0) {
      return;
    }
    if (attackIndex >= this.attacks.length) {
      throw new Error('Invalid attack index');
    }

    const attack = this.attacks[attackIndex];

    if (attack.projectileClass) {
      const projectile = new attack.projectileClass(this.owner);
      projectile.fireAtActor(enemy);
    } else {
      const enemyHealthComponent = enemy.components.findComponent(HealthComponent);
      if (enemyHealthComponent) {
        enemyHealthComponent.takeDamage(attack.damage, attack.damageType, this.owner);
      } else {
        throw new Error('Enemy has no health component');
      }
    }
  }

  // actor will automatically select and attack targets
  GetAcquisitionRadius(): number {
    // todo
    return 0;
  }
  GetChaseRadius(): number {
    // todo
    return 0;
  }

  // Different attacks might be used at different ranges, or against different types of targets
  GetAttacks(): AttackData[] {
    return this.attacks;
  }

  // time till next attack
  getRemainingCooldown(attackIndex: number): number {
    // todo
    return 0;
  }
}
