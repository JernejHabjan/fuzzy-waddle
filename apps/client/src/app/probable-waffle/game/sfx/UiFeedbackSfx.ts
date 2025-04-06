// This file was generated from "convert-to-enums.js" script
import { SoundDefinition } from "../entity/actor/components/audio-actor-component";
import { AudioSprites } from "./AudioSprites";

export enum UiFeedbackSfx {
  ACHIEVEMENT = "achievement",
  BUILD_DENIED = "build denied",
  BUTTON_CLICK = "button click",
  COUNTDOWN_BEEP_FINAL = "countdown beep final",
  COUNTDOWN_BEEP = "countdown beep",
  DEFEAT = "defeat",
  NOT_ENOUGH_RESOURCES = "not_enough_resources",
  PRODUCTION_QUEUE_FULL = "production_queue_full",
  VICTORY = "victory",
  YOU_ARE_UNDER_ATTACK = "you are under attack"
}

export const UiFeedbackSfxCountdownSounds: SoundDefinition[] = [
  { key: AudioSprites.UI_FEEDBACK, spriteName: UiFeedbackSfx.COUNTDOWN_BEEP_FINAL },
  { key: AudioSprites.UI_FEEDBACK, spriteName: UiFeedbackSfx.COUNTDOWN_BEEP }
];
