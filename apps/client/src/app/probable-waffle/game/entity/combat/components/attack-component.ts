import { IComponent } from '../../../core/component.service';
import { Actor } from '../../actor/actor';
import { AttackData } from '../attack-data';
import { EventEmitter } from '@angular/core';
import HealthComponent from './health-component';
import { RepresentableActor } from '../../actor/representable-actor';
import { SpriteRepresentationComponent } from '../../actor/components/sprite-representable-component';

export interface Attacker {
  attackComponent: AttackComponent;
}

export class AttackComponent implements IComponent {
  // when cooldown has expired
  onCooldownReady: EventEmitter<Actor> = new EventEmitter<Actor>();
  // actor used an attack
  onAttackUsed: EventEmitter<AttackData> = new EventEmitter<AttackData>();
  remainingCooldown = 0;
  private spriteRepresentationComponent!: SpriteRepresentationComponent;
  constructor(private owner: RepresentableActor, private attacks: AttackData[]) {}

  init(): void {
    this.spriteRepresentationComponent = this.owner.components.findComponent(SpriteRepresentationComponent);
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
      const projectile = new attack.projectileClass(this.spriteRepresentationComponent.scene, this.owner); // todo here it should be getWorld.SpawnActor<ProjectileClass>(attack.projectileClass, transform, spawnInfo)
      projectile.init(); // todo should be called by registration engine
      projectile.start(); // todo should be called by registration engine
      projectile.fireAtActor(enemy); // todo should be triggered only after init and start
    } else {
      const enemyHealthComponent = enemy.components.findComponent(HealthComponent);
      enemyHealthComponent.takeDamage(attack.damage, attack.damageType, this.owner);
    }
  }

  // actor will automatically select and attack targets
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
