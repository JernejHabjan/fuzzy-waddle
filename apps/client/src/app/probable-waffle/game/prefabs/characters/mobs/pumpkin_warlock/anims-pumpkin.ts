import { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const ATTACK_E = "mobs_pumpkin_warlock_Pumpkin/pumpkin - attack/e";
const ATTACK_N = "mobs_pumpkin_warlock_Pumpkin/pumpkin - attack/n";
const ATTACK_S = "mobs_pumpkin_warlock_Pumpkin/pumpkin - attack/s";
const ATTACK_W = "mobs_pumpkin_warlock_Pumpkin/pumpkin - attack/w";
const DEATH_E = "mobs_pumpkin_warlock_Pumpkin/pumpkin - death/e";
const DEATH_N = "mobs_pumpkin_warlock_Pumpkin/pumpkin - death/n";
const DEATH_S = "mobs_pumpkin_warlock_Pumpkin/pumpkin - death/s";
const DEATH_W = "mobs_pumpkin_warlock_Pumpkin/pumpkin - death/w";
const HIT_E = "mobs_pumpkin_warlock_Pumpkin/pumpkin - hit/e";
const HIT_N = "mobs_pumpkin_warlock_Pumpkin/pumpkin - hit/n";
const HIT_S = "mobs_pumpkin_warlock_Pumpkin/pumpkin - hit/s";
const HIT_W = "mobs_pumpkin_warlock_Pumpkin/pumpkin - hit/w";
const JUMP_E = "mobs_pumpkin_warlock_Pumpkin/pumpkin - jump/e";
const JUMP_N = "mobs_pumpkin_warlock_Pumpkin/pumpkin - jump/n";
const JUMP_S = "mobs_pumpkin_warlock_Pumpkin/pumpkin - jump/s";
const JUMP_W = "mobs_pumpkin_warlock_Pumpkin/pumpkin - jump/w";

export enum PumpkinWarlockPumpkinAnimationTypes {
  Jump = "Jump"
}

export const ANIM_PUMPKIN_WARLOCK_PUMPKIN_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    south: { key: JUMP_S },
    north: { key: JUMP_N },
    west: { key: JUMP_W },
    east: { key: JUMP_E }
  },
  [AnimationType.Walk]: {
    south: { key: JUMP_S },
    north: { key: JUMP_N },
    west: { key: JUMP_W },
    east: { key: JUMP_E }
  },
  [AnimationType.Death]: {
    south: { key: DEATH_S },
    north: { key: DEATH_N },
    west: { key: DEATH_W },
    east: { key: DEATH_E }
  },
  [AnimationType.Slash]: {
    south: { key: ATTACK_S },
    north: { key: ATTACK_N },
    west: { key: ATTACK_W },
    east: { key: ATTACK_E }
  },
  [AnimationType.Damage]: {
    south: { key: HIT_S },
    north: { key: HIT_N },
    west: { key: HIT_W },
    east: { key: HIT_E }
  },
  [PumpkinWarlockPumpkinAnimationTypes.Jump]: {
    south: { key: JUMP_S },
    north: { key: JUMP_N },
    west: { key: JUMP_W },
    east: { key: JUMP_E }
  }
};
