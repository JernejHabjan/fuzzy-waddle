import type { AnimationVariant } from "./animation-variant";

export interface AnimationOptions {
  forceRestart?: boolean;
  onComplete?: () => void;
  repeat?: number;
  variant?: AnimationVariant;
}
