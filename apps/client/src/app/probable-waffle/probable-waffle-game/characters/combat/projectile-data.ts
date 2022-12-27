import { DamageType } from './damage-type';

export class ProjectileData {
  constructor(public damage: number, public damageType: DamageType, public speed: number, public range: number) {}
}
