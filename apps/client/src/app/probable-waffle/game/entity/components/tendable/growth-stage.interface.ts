import type { AnimationType } from "../animation/animation-type";
import type { SoundType } from "../actor-audio/sound-type";

export interface GrowthStageInterface {
  /** Set the visual growth stage. Stage 3 = depleted/cut (regular crops) or invisible (ground crops). */
  setStage(stageIndex: number): void;
  destroy(): void;
  /** Animation to play when a worker is harvesting this crop. */
  readonly harvestAnimation: AnimationType;
  /** Sound to play when harvesting this crop. */
  readonly harvestSound: SoundType;
  /** Animation to play when a worker is tending (digging) this crop after the seeding phase. */
  readonly tendAnimation: AnimationType;
}

/** Implemented by any resource source that hosts crops (e.g. Field). */
export interface CropResourceSourceInterface {
  getActiveCropHarvestAnimation(): AnimationType | null;
  getActiveCropHarvestSound(): SoundType | null;
  getActiveCropTendAnimation(): AnimationType | null;
}

export function isCropResourceSource(obj: unknown): obj is CropResourceSourceInterface {
  return (
    !!obj &&
    typeof (obj as CropResourceSourceInterface).getActiveCropHarvestAnimation === "function" &&
    typeof (obj as CropResourceSourceInterface).getActiveCropHarvestSound === "function" &&
    typeof (obj as CropResourceSourceInterface).getActiveCropTendAnimation === "function"
  );
}

/** Constructor type for any prefab that implements GrowthStageInterface. */
export type GrowthStageCtor = new (
  scene: Phaser.Scene,
  x?: number,
  y?: number,
  texture?: string,
  frame?: number | string
) => Phaser.GameObjects.Image & GrowthStageInterface;
