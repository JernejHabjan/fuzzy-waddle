import { ProductionInvalidReason } from "./production-invalid-reason";
import { ObjectNames, ResourceType } from "@fuzzy-waddle/api-interfaces";

export interface ProductionValidationResult {
  canQueue: boolean;
  reason?: ProductionInvalidReason;
  techBlocked?: boolean;
  supplyBlocked?: boolean;
  buildingPrereqBlocked?: boolean;
  prereqs: ObjectNames[];
  missingBuildings?: ObjectNames[];
  cost?: Partial<Record<ResourceType, number>>;
}
