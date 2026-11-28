import type { AnimationDefinitionMap } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/animation/animation-definition-map";
import { AnimationType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/animation/animation-type";

export const ANIM_CATAPULT_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: "siege_weapons/catapult/idle/n" },
    northeast: { key: "siege_weapons/catapult/idle/ne" },
    east: { key: "siege_weapons/catapult/idle/e" },
    southeast: { key: "siege_weapons/catapult/idle/se" },
    south: { key: "siege_weapons/catapult/idle/s" },
    southwest: { key: "siege_weapons/catapult/idle/sw" },
    west: { key: "siege_weapons/catapult/idle/w" },
    northwest: { key: "siege_weapons/catapult/idle/nw" }
  },
  [AnimationType.Walk]: {
    north: { key: "siege_weapons/catapult/move/n" },
    northeast: { key: "siege_weapons/catapult/move/ne" },
    east: { key: "siege_weapons/catapult/move/e" },
    southeast: { key: "siege_weapons/catapult/move/se" },
    south: { key: "siege_weapons/catapult/move/s" },
    southwest: { key: "siege_weapons/catapult/move/sw" },
    west: { key: "siege_weapons/catapult/move/w" },
    northwest: { key: "siege_weapons/catapult/move/nw" }
  },
  [AnimationType.Shoot]: {
    north: { key: "siege_weapons/catapult/attack/n" },
    northeast: { key: "siege_weapons/catapult/attack/ne" },
    east: { key: "siege_weapons/catapult/attack/e" },
    southeast: { key: "siege_weapons/catapult/attack/se" },
    south: { key: "siege_weapons/catapult/attack/s" },
    southwest: { key: "siege_weapons/catapult/attack/sw" },
    west: { key: "siege_weapons/catapult/attack/w" },
    northwest: { key: "siege_weapons/catapult/attack/nw" }
  }
};
