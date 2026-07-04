import { AnimationType } from "../../../../../entity/components/animation/animation-type";
import { AnimationVariant } from "../../../../../entity/components/animation/animation-variant";
import type { AnimationDefinitionMap } from "../../../../../entity/components/animation/animation-definition-map";

const ANIM_AXE_LOGS_WALK = "tivara_worker_male_axe_logs_walk";
const ANIM_AXE_LOGS_WALK_1 = "tivara_worker_male_axe_logs_walk_1";
const ANIM_AXE_LOGS_WALK_2 = "tivara_worker_male_axe_logs_walk_2";
const ANIM_AXE_LOGS_WALK_3 = "tivara_worker_male_axe_logs_walk_3";
const ANIM_AXE_SMASH = "tivara_worker_male_axe_smash";
const ANIM_AXE_SMASH_1 = "tivara_worker_male_axe_smash_1";
const ANIM_AXE_SMASH_2 = "tivara_worker_male_axe_smash_2";
const ANIM_AXE_SMASH_3 = "tivara_worker_male_axe_smash_3";
const ANIM_BASE_HURT = "tivara_worker_male_base_hurt";
const ANIM_BASE_IDLE = "tivara_worker_male_base_idle";
const ANIM_BASE_IDLE_1 = "tivara_worker_male_base_idle_1";
const ANIM_BASE_IDLE_2 = "tivara_worker_male_base_idle_2";
const ANIM_BASE_IDLE_3 = "tivara_worker_male_base_idle_3";
const ANIM_BASE_SLASH = "tivara_worker_male_base_slash";
const ANIM_BASE_SLASH_1 = "tivara_worker_male_base_slash_1";
const ANIM_BASE_SLASH_2 = "tivara_worker_male_base_slash_2";
const ANIM_BASE_SLASH_3 = "tivara_worker_male_base_slash_3";
const ANIM_BASE_THRUST = "tivara_worker_male_base_thrust";
const ANIM_BASE_THRUST_1 = "tivara_worker_male_base_thrust_1";
const ANIM_BASE_THRUST_2 = "tivara_worker_male_base_thrust_2";
const ANIM_BASE_THRUST_3 = "tivara_worker_male_base_thrust_3";
const ANIM_BASE_WALK = "tivara_worker_male_base_walk";
const ANIM_BASE_WALK_1 = "tivara_worker_male_base_walk_1";
const ANIM_BASE_WALK_2 = "tivara_worker_male_base_walk_2";
const ANIM_BASE_WALK_3 = "tivara_worker_male_base_walk_3";
const ANIM_HAMMER_SMASH = "tivara_worker_male_hammer_smash";
const ANIM_HAMMER_SMASH_1 = "tivara_worker_male_hammer_smash_1";
const ANIM_HAMMER_SMASH_2 = "tivara_worker_male_hammer_smash_2";
const ANIM_HAMMER_SMASH_3 = "tivara_worker_male_hammer_smash_3";
const ANIM_HOE_THRUST = "tivara_worker_male_hoe_thrust";
const ANIM_HOE_THRUST_1 = "tivara_worker_male_hoe_thrust_1";
const ANIM_HOE_THRUST_2 = "tivara_worker_male_hoe_thrust_2";
const ANIM_HOE_THRUST_3 = "tivara_worker_male_hoe_thrust_3";
const ANIM_PICKAXE_ORE_WALK = "tivara_worker_male_pickaxe_ore_walk";
const ANIM_PICKAXE_ORE_WALK_1 = "tivara_worker_male_pickaxe_ore_walk_1";
const ANIM_PICKAXE_ORE_WALK_2 = "tivara_worker_male_pickaxe_ore_walk_2";
const ANIM_PICKAXE_ORE_WALK_3 = "tivara_worker_male_pickaxe_ore_walk_3";
const ANIM_PICKAXE_SMASH = "tivara_worker_male_pickaxe_smash";
const ANIM_PICKAXE_SMASH_1 = "tivara_worker_male_pickaxe_smash_1";
const ANIM_PICKAXE_SMASH_2 = "tivara_worker_male_pickaxe_smash_2";
const ANIM_PICKAXE_SMASH_3 = "tivara_worker_male_pickaxe_smash_3";
const ANIM_SCYTHE_BASKET_SLASH = "tivara_worker_male_scythe_basket_slash";
const ANIM_SCYTHE_BASKET_SLASH_1 = "tivara_worker_male_scythe_basket_slash_1";
const ANIM_SCYTHE_BASKET_SLASH_2 = "tivara_worker_male_scythe_basket_slash_2";
const ANIM_SCYTHE_BASKET_SLASH_3 = "tivara_worker_male_scythe_basket_slash_3";
const ANIM_SCYTHE_BASKET_WALK = "tivara_worker_male_scythe_basket_walk";
const ANIM_SCYTHE_BASKET_WALK_1 = "tivara_worker_male_scythe_basket_walk_1";
const ANIM_SCYTHE_BASKET_WALK_2 = "tivara_worker_male_scythe_basket_walk_2";
const ANIM_SCYTHE_BASKET_WALK_3 = "tivara_worker_male_scythe_basket_walk_3";

export const ANIM_TIVARA_WORKER_MALE_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    north: { key: ANIM_BASE_IDLE },
    south: { key: ANIM_BASE_IDLE_2 },
    west: { key: ANIM_BASE_IDLE_1 },
    east: { key: ANIM_BASE_IDLE_3 }
  },
  [AnimationType.Walk]: {
    north: {
      key: ANIM_BASE_WALK,
      variants: {
        [AnimationVariant.CarryingLogs]: ANIM_AXE_LOGS_WALK,
        [AnimationVariant.CarryingOre]: ANIM_PICKAXE_ORE_WALK,
        [AnimationVariant.CarryingBasket]: ANIM_SCYTHE_BASKET_WALK
      }
    },
    south: {
      key: ANIM_BASE_WALK_2,
      variants: {
        [AnimationVariant.CarryingLogs]: ANIM_AXE_LOGS_WALK_2,
        [AnimationVariant.CarryingOre]: ANIM_PICKAXE_ORE_WALK_2,
        [AnimationVariant.CarryingBasket]: ANIM_SCYTHE_BASKET_WALK_2
      }
    },
    west: {
      key: ANIM_BASE_WALK_1,
      variants: {
        [AnimationVariant.CarryingLogs]: ANIM_AXE_LOGS_WALK_1,
        [AnimationVariant.CarryingOre]: ANIM_PICKAXE_ORE_WALK_1,
        [AnimationVariant.CarryingBasket]: ANIM_SCYTHE_BASKET_WALK_1
      }
    },
    east: {
      key: ANIM_BASE_WALK_3,
      variants: {
        [AnimationVariant.CarryingLogs]: ANIM_AXE_LOGS_WALK_3,
        [AnimationVariant.CarryingOre]: ANIM_PICKAXE_ORE_WALK_3,
        [AnimationVariant.CarryingBasket]: ANIM_SCYTHE_BASKET_WALK_3
      }
    }
  },
  [AnimationType.Slash]: {
    north: { key: ANIM_BASE_SLASH },
    south: { key: ANIM_BASE_SLASH_2 },
    west: { key: ANIM_BASE_SLASH_1 },
    east: { key: ANIM_BASE_SLASH_3 }
  },
  [AnimationType.Thrust]: {
    north: { key: ANIM_BASE_THRUST },
    south: { key: ANIM_BASE_THRUST_2 },
    west: { key: ANIM_BASE_THRUST_1 },
    east: { key: ANIM_BASE_THRUST_3 }
  },
  [AnimationType.Chop]: {
    north: { key: ANIM_AXE_SMASH },
    south: { key: ANIM_AXE_SMASH_2 },
    west: { key: ANIM_AXE_SMASH_1 },
    east: { key: ANIM_AXE_SMASH_3 }
  },
  [AnimationType.Dig]: {
    north: { key: ANIM_HOE_THRUST },
    south: { key: ANIM_HOE_THRUST_2 },
    west: { key: ANIM_HOE_THRUST_1 },
    east: { key: ANIM_HOE_THRUST_3 }
  },
  [AnimationType.Mine]: {
    north: { key: ANIM_PICKAXE_SMASH },
    south: { key: ANIM_PICKAXE_SMASH_2 },
    west: { key: ANIM_PICKAXE_SMASH_1 },
    east: { key: ANIM_PICKAXE_SMASH_3 }
  },
  [AnimationType.Harvest]: {
    north: { key: ANIM_SCYTHE_BASKET_SLASH },
    south: { key: ANIM_SCYTHE_BASKET_SLASH_2 },
    west: { key: ANIM_SCYTHE_BASKET_SLASH_1 },
    east: { key: ANIM_SCYTHE_BASKET_SLASH_3 }
  },
  [AnimationType.Death]: {
    north: { key: ANIM_BASE_HURT },
    south: { key: ANIM_BASE_HURT },
    west: { key: ANIM_BASE_HURT },
    east: { key: ANIM_BASE_HURT }
  },
  [AnimationType.Build]: {
    north: { key: ANIM_HAMMER_SMASH },
    south: { key: ANIM_HAMMER_SMASH_2 },
    west: { key: ANIM_HAMMER_SMASH_1 },
    east: { key: ANIM_HAMMER_SMASH_3 }
  },
  [AnimationType.Repair]: {
    north: { key: ANIM_HAMMER_SMASH },
    south: { key: ANIM_HAMMER_SMASH_2 },
    west: { key: ANIM_HAMMER_SMASH_1 },
    east: { key: ANIM_HAMMER_SMASH_3 }
  }
};
