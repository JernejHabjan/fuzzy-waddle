import { AnimationType } from "./animation-type";
import type { IsoDirection } from "../movement/iso-directions";
import type { AnimationDefinition } from "./animation-definition";

export type AnimationDefinitionMap = {
  [key in AnimationType | string]?: {
    [direction in IsoDirection]?: AnimationDefinition;
  };
};
