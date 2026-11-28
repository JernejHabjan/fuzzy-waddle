import type { AnimationDefinitionMap } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/animation/animation-definition-map";
import { AnimationType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/animation/animation-type";

export const ANIM_CANNON_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: "siege_weapons/cannon/idle/n" },
    east: { key: "siege_weapons/cannon/idle/e" },
    south: { key: "siege_weapons/cannon/idle/s" },
    west: { key: "siege_weapons/cannon/idle/w" }
  },
  [AnimationType.Walk]: {
    north: { key: "siege_weapons/cannon/move/n" },
    east: { key: "siege_weapons/cannon/move/e" },
    south: { key: "siege_weapons/cannon/move/s" },
    west: { key: "siege_weapons/cannon/move/w" }
  },
  [AnimationType.Shoot]: {
    north: { key: "siege_weapons/cannon/attack/n" },
    east: { key: "siege_weapons/cannon/attack/e" },
    south: { key: "siege_weapons/cannon/attack/s" },
    west: { key: "siege_weapons/cannon/attack/w" }
  }
};
