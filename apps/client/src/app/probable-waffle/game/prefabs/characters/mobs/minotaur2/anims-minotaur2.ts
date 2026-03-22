import { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const ANIM_MOBS_MINOTAUR2_DEATH_E = "mobs_minotaur2_death/e";
const ANIM_MOBS_MINOTAUR2_DEATH_N = "mobs_minotaur2_death/n";
const ANIM_MOBS_MINOTAUR2_DEATH_S = "mobs_minotaur2_death/s";
const ANIM_MOBS_MINOTAUR2_DEATH_W = "mobs_minotaur2_death/w";
const ANIM_MOBS_MINOTAUR2_HIT_E = "mobs_minotaur2_hit/e";
const ANIM_MOBS_MINOTAUR2_HIT_N = "mobs_minotaur2_hit/n";
const ANIM_MOBS_MINOTAUR2_HIT_S = "mobs_minotaur2_hit/s";
const ANIM_MOBS_MINOTAUR2_HIT_W = "mobs_minotaur2_hit/w";
const ANIM_MOBS_MINOTAUR2_HORN_ATTACK_E = "mobs_minotaur2_horn attack/e";
const ANIM_MOBS_MINOTAUR2_HORN_ATTACK_N = "mobs_minotaur2_horn attack/n";
const ANIM_MOBS_MINOTAUR2_HORN_ATTACK_S = "mobs_minotaur2_horn attack/s";
const ANIM_MOBS_MINOTAUR2_HORN_ATTACK_W = "mobs_minotaur2_horn attack/w";
const ANIM_MOBS_MINOTAUR2_IDLE_E = "mobs_minotaur2_idle/e";
const ANIM_MOBS_MINOTAUR2_IDLE_N = "mobs_minotaur2_idle/n";
const ANIM_MOBS_MINOTAUR2_IDLE_S = "mobs_minotaur2_idle/s";
const ANIM_MOBS_MINOTAUR2_IDLE_W = "mobs_minotaur2_idle/w";
const ANIM_MOBS_MINOTAUR2_PUNCH_ATTACK_E = "mobs_minotaur2_punch attack/e";
const ANIM_MOBS_MINOTAUR2_PUNCH_ATTACK_N = "mobs_minotaur2_punch attack/n";
const ANIM_MOBS_MINOTAUR2_PUNCH_ATTACK_S = "mobs_minotaur2_punch attack/s";
const ANIM_MOBS_MINOTAUR2_PUNCH_ATTACK_W = "mobs_minotaur2_punch attack/w";
const ANIM_MOBS_MINOTAUR2_RUN_E = "mobs_minotaur2_run/e";
const ANIM_MOBS_MINOTAUR2_RUN_N = "mobs_minotaur2_run/n";
const ANIM_MOBS_MINOTAUR2_RUN_S = "mobs_minotaur2_run/s";
const ANIM_MOBS_MINOTAUR2_RUN_W = "mobs_minotaur2_run/w";
const ANIM_MOBS_MINOTAUR2_STOMP_ATTACK_E = "mobs_minotaur2_stomp attack/e";
const ANIM_MOBS_MINOTAUR2_STOMP_ATTACK_N = "mobs_minotaur2_stomp attack/n";
const ANIM_MOBS_MINOTAUR2_STOMP_ATTACK_S = "mobs_minotaur2_stomp attack/s";
const ANIM_MOBS_MINOTAUR2_STOMP_ATTACK_W = "mobs_minotaur2_stomp attack/w";

export enum Minotaur2AnimationTypes {
  HornAttack = "HornAttack",
  PunchAttack = "PunchAttack",
  StompAttack = "StompAttack"
}

export const ANIM_MINOTAUR2_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    south: { key: ANIM_MOBS_MINOTAUR2_IDLE_S },
    north: { key: ANIM_MOBS_MINOTAUR2_IDLE_N },
    west: { key: ANIM_MOBS_MINOTAUR2_IDLE_W },
    east: { key: ANIM_MOBS_MINOTAUR2_IDLE_E }
  },
  [AnimationType.Walk]: {
    south: { key: ANIM_MOBS_MINOTAUR2_RUN_S },
    north: { key: ANIM_MOBS_MINOTAUR2_RUN_N },
    west: { key: ANIM_MOBS_MINOTAUR2_RUN_W },
    east: { key: ANIM_MOBS_MINOTAUR2_RUN_E }
  },
  [AnimationType.Run]: {
    south: { key: ANIM_MOBS_MINOTAUR2_RUN_S },
    north: { key: ANIM_MOBS_MINOTAUR2_RUN_N },
    west: { key: ANIM_MOBS_MINOTAUR2_RUN_W },
    east: { key: ANIM_MOBS_MINOTAUR2_RUN_E }
  },
  [AnimationType.Death]: {
    south: { key: ANIM_MOBS_MINOTAUR2_DEATH_S },
    north: { key: ANIM_MOBS_MINOTAUR2_DEATH_N },
    west: { key: ANIM_MOBS_MINOTAUR2_DEATH_W },
    east: { key: ANIM_MOBS_MINOTAUR2_DEATH_E }
  },
  [AnimationType.Damage]: {
    south: { key: ANIM_MOBS_MINOTAUR2_HIT_S },
    north: { key: ANIM_MOBS_MINOTAUR2_HIT_N },
    west: { key: ANIM_MOBS_MINOTAUR2_HIT_W },
    east: { key: ANIM_MOBS_MINOTAUR2_HIT_E }
  },
  [Minotaur2AnimationTypes.HornAttack]: {
    south: { key: ANIM_MOBS_MINOTAUR2_HORN_ATTACK_S },
    north: { key: ANIM_MOBS_MINOTAUR2_HORN_ATTACK_N },
    west: { key: ANIM_MOBS_MINOTAUR2_HORN_ATTACK_W },
    east: { key: ANIM_MOBS_MINOTAUR2_HORN_ATTACK_E }
  },
  [Minotaur2AnimationTypes.PunchAttack]: {
    south: { key: ANIM_MOBS_MINOTAUR2_PUNCH_ATTACK_S },
    north: { key: ANIM_MOBS_MINOTAUR2_PUNCH_ATTACK_N },
    west: { key: ANIM_MOBS_MINOTAUR2_PUNCH_ATTACK_W },
    east: { key: ANIM_MOBS_MINOTAUR2_PUNCH_ATTACK_E }
  },
  [Minotaur2AnimationTypes.StompAttack]: {
    south: { key: ANIM_MOBS_MINOTAUR2_STOMP_ATTACK_S },
    north: { key: ANIM_MOBS_MINOTAUR2_STOMP_ATTACK_N },
    west: { key: ANIM_MOBS_MINOTAUR2_STOMP_ATTACK_W },
    east: { key: ANIM_MOBS_MINOTAUR2_STOMP_ATTACK_E }
  }
};
