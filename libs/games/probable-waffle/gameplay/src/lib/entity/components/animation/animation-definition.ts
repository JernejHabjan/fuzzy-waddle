import type { AnimationVariant } from "./animation-variant";

export type AnimationDefinition = {
  readonly key: string;
  readonly mirrorX?: boolean;
  readonly frameRate?: number;
  readonly repeat?: number;
  readonly variants?: {
    readonly [K in AnimationVariant]?: string | Pick<AnimationDefinition, "key" | "mirrorX" | "frameRate" | "repeat">;
  };
};
