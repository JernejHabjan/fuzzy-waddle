import { DamageType } from "./damage-type";
import { ProjectileClass } from "./projectiles/projectiles";

export class AttackData {
  constructor(
    // Time before this attack can be used again, in seconds
    public cooldown: number,
    public damage: number,
    public damageType: DamageType,
    public range: number,
    // Type of the projectile to spawn - if not set, damage will be dealt instantly
    public projectileClass?: ProjectileClass
  ) {}
}
