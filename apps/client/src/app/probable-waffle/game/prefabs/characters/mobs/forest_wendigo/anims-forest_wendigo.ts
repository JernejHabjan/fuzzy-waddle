import { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const BRANCH_FULL_ANIMATION = "mobs_forest_wendigo_branch - full animation";
const ATTACK_1_E = "mobs_forest_wendigo_wendigo - attack 1/e";
const ATTACK_1_N = "mobs_forest_wendigo_wendigo - attack 1/n";
const ATTACK_1_S = "mobs_forest_wendigo_wendigo - attack 1/s";
const ATTACK_1_W = "mobs_forest_wendigo_wendigo - attack 1/w";
const ATTACK_2_E = "mobs_forest_wendigo_wendigo - attack 2/e";
const ATTACK_2_N = "mobs_forest_wendigo_wendigo - attack 2/n";
const ATTACK_2_S = "mobs_forest_wendigo_wendigo - attack 2/s";
const ATTACK_2_W = "mobs_forest_wendigo_wendigo - attack 2/w";
const ATTACK_3_E = "mobs_forest_wendigo_wendigo - attack 3/e";
const ATTACK_3_N = "mobs_forest_wendigo_wendigo - attack 3/n";
const ATTACK_3_S = "mobs_forest_wendigo_wendigo - attack 3/s";
const ATTACK_3_W = "mobs_forest_wendigo_wendigo - attack 3/w";
const DEATH_E = "mobs_forest_wendigo_wendigo - death/e";
const DEATH_N = "mobs_forest_wendigo_wendigo - death/n";
const DEATH_S = "mobs_forest_wendigo_wendigo - death/s";
const DEATH_W = "mobs_forest_wendigo_wendigo - death/w";
const HIT_E = "mobs_forest_wendigo_wendigo - hit/e";
const HIT_N = "mobs_forest_wendigo_wendigo - hit/n";
const HIT_S = "mobs_forest_wendigo_wendigo - hit/s";
const HIT_W = "mobs_forest_wendigo_wendigo - hit/w";
const IDLE_E = "mobs_forest_wendigo_wendigo - idle/e";
const IDLE_N = "mobs_forest_wendigo_wendigo - idle/n";
const IDLE_S = "mobs_forest_wendigo_wendigo - idle/s";
const IDLE_W = "mobs_forest_wendigo_wendigo - idle/w";
const WALK_E = "mobs_forest_wendigo_wendigo - walk/e";
const WALK_N = "mobs_forest_wendigo_wendigo - walk/n";
const WALK_S = "mobs_forest_wendigo_wendigo - walk/s";
const WALK_W = "mobs_forest_wendigo_wendigo - walk/w";

export enum ForestWendigoAnimationTypes {
  Attack1 = "Attack1",
  Attack2 = "Attack2",
  Attack3 = "Attack3",
  BranchAttack = "BranchAttack"
}
export const ANIM_FOREST_WENDIGO_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    south: { key: IDLE_S },
    north: { key: IDLE_N },
    west: { key: IDLE_W },
    east: { key: IDLE_E }
  },
  [AnimationType.Walk]: {
    south: { key: WALK_S },
    north: { key: WALK_N },
    west: { key: WALK_W },
    east: { key: WALK_E }
  },
  [AnimationType.Death]: {
    south: { key: DEATH_S },
    north: { key: DEATH_N },
    west: { key: DEATH_W },
    east: { key: DEATH_E }
  },
  [AnimationType.Damage]: {
    south: { key: HIT_S },
    north: { key: HIT_N },
    west: { key: HIT_W },
    east: { key: HIT_E }
  },
  [ForestWendigoAnimationTypes.Attack1]: {
    south: { key: ATTACK_1_S },
    north: { key: ATTACK_1_N },
    west: { key: ATTACK_1_W },
    east: { key: ATTACK_1_E }
  },
  [ForestWendigoAnimationTypes.Attack2]: {
    south: { key: ATTACK_2_S },
    north: { key: ATTACK_2_N },
    west: { key: ATTACK_2_W },
    east: { key: ATTACK_2_E }
  },
  [ForestWendigoAnimationTypes.Attack3]: {
    south: { key: ATTACK_3_S },
    north: { key: ATTACK_3_N },
    west: { key: ATTACK_3_W },
    east: { key: ATTACK_3_E }
  },
  [ForestWendigoAnimationTypes.BranchAttack]: {
    south: { key: BRANCH_FULL_ANIMATION },
    north: { key: BRANCH_FULL_ANIMATION },
    west: { key: BRANCH_FULL_ANIMATION },
    east: { key: BRANCH_FULL_ANIMATION }
  }
};
