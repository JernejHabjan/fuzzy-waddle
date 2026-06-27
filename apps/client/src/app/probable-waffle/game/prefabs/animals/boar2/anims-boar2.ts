import { AnimationType } from "../../../entity/components/animation/animation-type";
import type { AnimationDefinitionMap } from "../../../entity/components/animation/animation-definition-map";

const ANIM_BOAR_ATTACK_BACK_BOAR_BACK_ATTACK = "Boar/Attack/back/Boar_back_Attack";
const ANIM_BOAR_ATTACK_FRONT_BOAR_FRONT_ATTACK = "Boar/Attack/front/Boar_front_Attack";
const ANIM_BOAR_ATTACK_LEFT_BOAR_LEFT_ATTACK = "Boar/Attack/left/Boar_left_Attack";
const ANIM_BOAR_ATTACK_RIGHT_BOAR_ATTACK_RIGHT = "Boar/Attack/right/Boar_Attack_right";
const ANIM_BOAR_IDLE_BACK_BOAR_BACK_IDLE = "Boar/Idle/back/Boar_back_Idle";
const ANIM_BOAR_IDLE_FRONT_BOAR_FRONT_IDLE = "Boar/Idle/front/Boar_front_Idle";
const ANIM_BOAR_IDLE_LEFT_BOAR_LEFT_IDLE = "Boar/Idle/left/Boar_left_Idle";
const ANIM_BOAR_IDLE_RIGHT_BOAR_IDLE_RIGHT = "Boar/Idle/right/Boar_Idle_right";
const ANIM_BOAR_RUN_BACK_BOAR_BACK_RUN = "Boar/Run/back/Boar_back_Run";
const ANIM_BOAR_RUN_FRONT_BOAR_FRONT_RUN = "Boar/Run/front/Boar_front_Run";
const ANIM_BOAR_RUN_LEFT_BOAR_LEFT_RUN = "Boar/Run/left/Boar_left_Run";
const ANIM_BOAR_RUN_RIGHT_BOAR_RUN_RIGHT = "Boar/Run/right/Boar_Run_right";
const ANIM_BOAR_WALK_BACK_BOAR_BACK_WALK = "Boar/Walk/back/Boar_back_Walk";
const ANIM_BOAR_WALK_FRONT_BOAR_FRONT_WALK = "Boar/Walk/front/Boar_front_Walk";
const ANIM_BOAR_WALK_LEFT_BOAR_LEFT_WALK = "Boar/Walk/left/Boar_left_Walk";
const ANIM_BOAR_WALK_RIGHT_BOAR_WALK_RIGHT = "Boar/Walk/right/Boar_Walk_right";

export const ANIM_BOAR2_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Thrust]: {
    north: { key: ANIM_BOAR_ATTACK_BACK_BOAR_BACK_ATTACK },
    south: { key: ANIM_BOAR_ATTACK_FRONT_BOAR_FRONT_ATTACK },
    west: { key: ANIM_BOAR_ATTACK_LEFT_BOAR_LEFT_ATTACK },
    east: { key: ANIM_BOAR_ATTACK_RIGHT_BOAR_ATTACK_RIGHT }
  },
  [AnimationType.Idle]: {
    north: { key: ANIM_BOAR_IDLE_BACK_BOAR_BACK_IDLE },
    south: { key: ANIM_BOAR_IDLE_FRONT_BOAR_FRONT_IDLE },
    west: { key: ANIM_BOAR_IDLE_LEFT_BOAR_LEFT_IDLE },
    east: { key: ANIM_BOAR_IDLE_RIGHT_BOAR_IDLE_RIGHT }
  },
  [AnimationType.Walk]: {
    north: { key: ANIM_BOAR_WALK_BACK_BOAR_BACK_WALK },
    south: { key: ANIM_BOAR_WALK_FRONT_BOAR_FRONT_WALK },
    west: { key: ANIM_BOAR_WALK_LEFT_BOAR_LEFT_WALK },
    east: { key: ANIM_BOAR_WALK_RIGHT_BOAR_WALK_RIGHT }
  },
  [AnimationType.Run]: {
    north: { key: ANIM_BOAR_RUN_BACK_BOAR_BACK_RUN },
    south: { key: ANIM_BOAR_RUN_FRONT_BOAR_FRONT_RUN },
    west: { key: ANIM_BOAR_RUN_LEFT_BOAR_LEFT_RUN },
    east: { key: ANIM_BOAR_RUN_RIGHT_BOAR_RUN_RIGHT }
  }
};
