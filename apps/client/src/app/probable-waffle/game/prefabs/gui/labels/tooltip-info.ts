/* END OF COMPILED CODE */
import type { PreRequirementType, Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import type { PrefabDefinition } from "../../definitions/prefab-definition";

export type TooltipInfo = {
  iconKey: string;
  iconFrame: string;
  iconOrigin: Vector2Simple;
  title: string;
  description: string;
  definition?: PrefabDefinition;
  unmetRequirements?: PreRequirementType;
};
