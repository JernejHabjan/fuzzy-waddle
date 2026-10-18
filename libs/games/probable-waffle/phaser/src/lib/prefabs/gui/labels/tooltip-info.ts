/* END OF COMPILED CODE */
import type { PreRequirementType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
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
