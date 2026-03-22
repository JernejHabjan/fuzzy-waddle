import { AnimationDefinitionMap } from "../../../../entity/components/animation/animation-definition-map";
import { AnimationType } from "../../../../entity/components/animation/animation-type";

const ANIM_MOBS_MUSHROOM_WARRIOR_ATTACK_E = "mobs_mushroom_warrior_attack/e";
const ANIM_MOBS_MUSHROOM_WARRIOR_ATTACK_N = "mobs_mushroom_warrior_attack/n";
const ANIM_MOBS_MUSHROOM_WARRIOR_ATTACK_S = "mobs_mushroom_warrior_attack/s";
const ANIM_MOBS_MUSHROOM_WARRIOR_ATTACK_W = "mobs_mushroom_warrior_attack/w";
const ANIM_MOBS_MUSHROOM_WARRIOR_DEATH_E = "mobs_mushroom_warrior_death/e";
const ANIM_MOBS_MUSHROOM_WARRIOR_DEATH_N = "mobs_mushroom_warrior_death/n";
const ANIM_MOBS_MUSHROOM_WARRIOR_DEATH_S = "mobs_mushroom_warrior_death/s";
const ANIM_MOBS_MUSHROOM_WARRIOR_DEATH_W = "mobs_mushroom_warrior_death/w";
const ANIM_MOBS_MUSHROOM_WARRIOR_HIDDEN_E = "mobs_mushroom_warrior_hidden/e";
const ANIM_MOBS_MUSHROOM_WARRIOR_HIDDEN_N = "mobs_mushroom_warrior_hidden/n";
const ANIM_MOBS_MUSHROOM_WARRIOR_HIDDEN_S = "mobs_mushroom_warrior_hidden/s";
const ANIM_MOBS_MUSHROOM_WARRIOR_HIDDEN_W = "mobs_mushroom_warrior_hidden/w";
const ANIM_MOBS_MUSHROOM_WARRIOR_HIDE_E = "mobs_mushroom_warrior_hide/e";
const ANIM_MOBS_MUSHROOM_WARRIOR_HIDE_N = "mobs_mushroom_warrior_hide/n";
const ANIM_MOBS_MUSHROOM_WARRIOR_HIDE_S = "mobs_mushroom_warrior_hide/s";
const ANIM_MOBS_MUSHROOM_WARRIOR_HIDE_W = "mobs_mushroom_warrior_hide/w";
const ANIM_MOBS_MUSHROOM_WARRIOR_HIT_E = "mobs_mushroom_warrior_hit/e";
const ANIM_MOBS_MUSHROOM_WARRIOR_HIT_N = "mobs_mushroom_warrior_hit/n";
const ANIM_MOBS_MUSHROOM_WARRIOR_HIT_S = "mobs_mushroom_warrior_hit/s";
const ANIM_MOBS_MUSHROOM_WARRIOR_HIT_W = "mobs_mushroom_warrior_hit/w";
const ANIM_MOBS_MUSHROOM_WARRIOR_IDLE_E = "mobs_mushroom_warrior_idle/e";
const ANIM_MOBS_MUSHROOM_WARRIOR_IDLE_N = "mobs_mushroom_warrior_idle/n";
const ANIM_MOBS_MUSHROOM_WARRIOR_IDLE_S = "mobs_mushroom_warrior_idle/s";
const ANIM_MOBS_MUSHROOM_WARRIOR_IDLE_W = "mobs_mushroom_warrior_idle/w";
const ANIM_MOBS_MUSHROOM_WARRIOR_SHOW_UP_E = "mobs_mushroom_warrior_show up/e";
const ANIM_MOBS_MUSHROOM_WARRIOR_SHOW_UP_N = "mobs_mushroom_warrior_show up/n";
const ANIM_MOBS_MUSHROOM_WARRIOR_SHOW_UP_S = "mobs_mushroom_warrior_show up/s";
const ANIM_MOBS_MUSHROOM_WARRIOR_SHOW_UP_W = "mobs_mushroom_warrior_show up/w";
const ANIM_MOBS_MUSHROOM_WARRIOR_WALK_E = "mobs_mushroom_warrior_walk/e";
const ANIM_MOBS_MUSHROOM_WARRIOR_WALK_N = "mobs_mushroom_warrior_walk/n";
const ANIM_MOBS_MUSHROOM_WARRIOR_WALK_S = "mobs_mushroom_warrior_walk/s";
const ANIM_MOBS_MUSHROOM_WARRIOR_WALK_W = "mobs_mushroom_warrior_walk/w";

export enum MushroomWarriorAnimationTypes {
  Hide = "Hide",
  Hidden = "Hidden",
  ShowUp = "ShowUp"
}

export const ANIM_MUSHROOM_WARRIOR_DEFINITION: AnimationDefinitionMap = {
  [AnimationType.Idle]: {
    south: { key: ANIM_MOBS_MUSHROOM_WARRIOR_IDLE_S },
    north: { key: ANIM_MOBS_MUSHROOM_WARRIOR_IDLE_N },
    west: { key: ANIM_MOBS_MUSHROOM_WARRIOR_IDLE_W },
    east: { key: ANIM_MOBS_MUSHROOM_WARRIOR_IDLE_E }
  },
  [AnimationType.Walk]: {
    south: { key: ANIM_MOBS_MUSHROOM_WARRIOR_WALK_S },
    north: { key: ANIM_MOBS_MUSHROOM_WARRIOR_WALK_N },
    west: { key: ANIM_MOBS_MUSHROOM_WARRIOR_WALK_W },
    east: { key: ANIM_MOBS_MUSHROOM_WARRIOR_WALK_E }
  },
  [AnimationType.Death]: {
    south: { key: ANIM_MOBS_MUSHROOM_WARRIOR_DEATH_S },
    north: { key: ANIM_MOBS_MUSHROOM_WARRIOR_DEATH_N },
    west: { key: ANIM_MOBS_MUSHROOM_WARRIOR_DEATH_W },
    east: { key: ANIM_MOBS_MUSHROOM_WARRIOR_DEATH_E }
  },
  [AnimationType.Slash]: {
    south: { key: ANIM_MOBS_MUSHROOM_WARRIOR_ATTACK_S },
    north: { key: ANIM_MOBS_MUSHROOM_WARRIOR_ATTACK_N },
    west: { key: ANIM_MOBS_MUSHROOM_WARRIOR_ATTACK_W },
    east: { key: ANIM_MOBS_MUSHROOM_WARRIOR_ATTACK_E }
  },
  [AnimationType.Damage]: {
    south: { key: ANIM_MOBS_MUSHROOM_WARRIOR_HIT_S },
    north: { key: ANIM_MOBS_MUSHROOM_WARRIOR_HIT_N },
    west: { key: ANIM_MOBS_MUSHROOM_WARRIOR_HIT_W },
    east: { key: ANIM_MOBS_MUSHROOM_WARRIOR_HIT_E }
  },
  [MushroomWarriorAnimationTypes.Hide]: {
    south: { key: ANIM_MOBS_MUSHROOM_WARRIOR_HIDE_S },
    north: { key: ANIM_MOBS_MUSHROOM_WARRIOR_HIDE_N },
    west: { key: ANIM_MOBS_MUSHROOM_WARRIOR_HIDE_W },
    east: { key: ANIM_MOBS_MUSHROOM_WARRIOR_HIDE_E }
  },
  [MushroomWarriorAnimationTypes.Hidden]: {
    south: { key: ANIM_MOBS_MUSHROOM_WARRIOR_HIDDEN_S },
    north: { key: ANIM_MOBS_MUSHROOM_WARRIOR_HIDDEN_N },
    west: { key: ANIM_MOBS_MUSHROOM_WARRIOR_HIDDEN_W },
    east: { key: ANIM_MOBS_MUSHROOM_WARRIOR_HIDDEN_E }
  },
  [MushroomWarriorAnimationTypes.ShowUp]: {
    south: { key: ANIM_MOBS_MUSHROOM_WARRIOR_SHOW_UP_S },
    north: { key: ANIM_MOBS_MUSHROOM_WARRIOR_SHOW_UP_N },
    west: { key: ANIM_MOBS_MUSHROOM_WARRIOR_SHOW_UP_W },
    east: { key: ANIM_MOBS_MUSHROOM_WARRIOR_SHOW_UP_E }
  }
};
