import { AnimationType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/animation/animation-type";
import type { AnimationDefinitionMap } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/animation/animation-definition-map";

const ATTACK_CLAW_CLAW_ATTACK_BOTTOM_LEFT = "corpy/attack_claw/Corpio_claw_attack_bottom_left";
const ATTACK_CLAW_CLAW_ATTACK_UP_RIGHT = "corpy/attack_claw/Corpio_claw_attack_up_right";
const ATTACK_TAIL_ATTACK_TAIL_BOTTOM_LEFT = "corpy/attack_tail/Coprio_attack_tail_bottom_left";
const ATTACK_TAIL_ATTACK_TAIL_UP_RIGHT = "corpy/attack_tail/Corpio_attack_tail_up_right";
const IDLE_BOTTOM_LEFT = "corpy/idle/Corpio_idle_bottom_left";
const IDLE_UP_RIGHT = "corpy/idle/Corpio_idle_up_right";
const WALK_BOTTOM_LEFT = "corpy/walk/Corpio_walk_bottom_left";
const WALK_UP_RIGHT = "corpy/walk/Corpio_walk_up_right";
const ANIM_CORPY_DEATH_DEATH = "corpy/death/death";

export const ANIM_CORPY_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    northwest: { key: IDLE_UP_RIGHT, mirrorX: true },
    southwest: { key: IDLE_BOTTOM_LEFT },
    northeast: { key: IDLE_UP_RIGHT },
    southeast: { key: IDLE_BOTTOM_LEFT, mirrorX: true }
  },
  [AnimationType.Walk]: {
    northwest: { key: WALK_UP_RIGHT, mirrorX: true },
    southwest: { key: WALK_BOTTOM_LEFT },
    northeast: { key: WALK_UP_RIGHT },
    southeast: { key: WALK_BOTTOM_LEFT, mirrorX: true }
  },
  [AnimationType.Thrust]: {
    northwest: { key: ATTACK_CLAW_CLAW_ATTACK_UP_RIGHT, mirrorX: true },
    southwest: { key: ATTACK_CLAW_CLAW_ATTACK_BOTTOM_LEFT },
    northeast: { key: ATTACK_CLAW_CLAW_ATTACK_UP_RIGHT },
    southeast: { key: ATTACK_CLAW_CLAW_ATTACK_BOTTOM_LEFT, mirrorX: true }
  },
  [AnimationType.Shoot]: {
    northwest: { key: ATTACK_TAIL_ATTACK_TAIL_UP_RIGHT, mirrorX: true },
    southwest: { key: ATTACK_TAIL_ATTACK_TAIL_BOTTOM_LEFT },
    northeast: { key: ATTACK_TAIL_ATTACK_TAIL_UP_RIGHT },
    southeast: { key: ATTACK_TAIL_ATTACK_TAIL_BOTTOM_LEFT, mirrorX: true }
  },
  [AnimationType.Death]: {
    northwest: { key: ANIM_CORPY_DEATH_DEATH },
    southwest: { key: ANIM_CORPY_DEATH_DEATH },
    northeast: { key: ANIM_CORPY_DEATH_DEATH },
    southeast: { key: ANIM_CORPY_DEATH_DEATH }
  }
};
