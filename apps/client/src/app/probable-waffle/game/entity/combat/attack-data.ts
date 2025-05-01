import { DamageType } from "./damage-type";
import { AnimationType } from "../actor/components/animation-actor-component";

export interface AttackData {
  // Time before this attack can be used again, in seconds
  cooldown: number;
  damage: number;
  damageType: DamageType;
  // nr of tiles the attack can reach
  range: number;
  // Type of the projectile to spawn - if not set, damage will be dealt instantly
  projectileType?: string;
  animationType: AnimationType;
}
