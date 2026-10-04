import type { AnimationDefinitionMap } from "./animation-definition-map";
import type { IsoDirection } from "../movement/iso-directions";

export interface ActorAnimationsDefinition {
  animations: AnimationDefinitionMap;
  defaultDirection?: IsoDirection;
}
