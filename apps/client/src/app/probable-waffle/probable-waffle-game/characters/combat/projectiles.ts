import { ProjectileData } from './projectile-data';
import { DamageTypes } from './damage-types';

export class Projectiles {
  static projectileArrow: ProjectileData = new ProjectileData(10, DamageTypes.DamageTypeNormal, 10, 10);
}
