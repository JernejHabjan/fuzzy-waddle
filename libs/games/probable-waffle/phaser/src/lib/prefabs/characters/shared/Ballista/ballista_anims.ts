import type { AnimationDefinitionMap } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/animation/animation-definition-map";
import { AnimationType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/animation/animation-type";

export const ANIM_BALLISTA_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: "siege_weapons/ballista/idle/n" },
    northeast: { key: "siege_weapons/ballista/idle/ne" },
    east: { key: "siege_weapons/ballista/idle/e" },
    southeast: { key: "siege_weapons/ballista/idle/se" },
    south: { key: "siege_weapons/ballista/idle/s" },
    southwest: { key: "siege_weapons/ballista/idle/sw" },
    west: { key: "siege_weapons/ballista/idle/w" },
    northwest: { key: "siege_weapons/ballista/idle/nw" }
  },
  [AnimationType.Walk]: {
    north: { key: "siege_weapons/ballista/move/n" },
    northeast: { key: "siege_weapons/ballista/move/ne" },
    east: { key: "siege_weapons/ballista/move/e" },
    southeast: { key: "siege_weapons/ballista/move/se" },
    south: { key: "siege_weapons/ballista/move/s" },
    southwest: { key: "siege_weapons/ballista/move/sw" },
    west: { key: "siege_weapons/ballista/move/w" },
    northwest: { key: "siege_weapons/ballista/move/nw" }
  },
  [AnimationType.Shoot]: {
    north: { key: "siege_weapons/ballista/attack/n" },
    northeast: { key: "siege_weapons/ballista/attack/ne" },
    east: { key: "siege_weapons/ballista/attack/e" },
    southeast: { key: "siege_weapons/ballista/attack/se" },
    south: { key: "siege_weapons/ballista/attack/s" },
    southwest: { key: "siege_weapons/ballista/attack/sw" },
    west: { key: "siege_weapons/ballista/attack/w" },
    northwest: { key: "siege_weapons/ballista/attack/nw" }
  }
};
