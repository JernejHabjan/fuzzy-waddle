/* END OF COMPILED CODE */
import type { ObjectNames, Vector2Simple } from "@fuzzy-waddle/api-interfaces";
import type { PrefabDefinition } from "../../definitions/prefab-definition";
import type { ResearchType } from "../../../entity/components/research/research-type";

export type TooltipInfo = {
  iconKey: string;
  iconFrame: string;
  iconOrigin: Vector2Simple;
  title: string;
  description: string;
  definition?: PrefabDefinition;
  unmetRequirements?: ObjectNames[] | ResearchType[];
};
