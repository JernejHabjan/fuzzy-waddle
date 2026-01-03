export type ConstructionSiteDefinition = {
  // Whether the building site consumes builders when building is finished
  consumesBuilders: boolean;
  maxAssignedBuilders: number;
  maxAssignedRepairers: number;
  // Factor to multiply all passed building time with, independent of any currently assigned builders
  progressMadeAutomatically: number;
  // Factor to multiply all passed building time with, dependent on the number of builders assigned
  progressMadePerBuilder: number;
  repairFactor: number;
  initialHealthPercentage: number;
  refundFactor: number;
  // Whether to start building immediately after spawn, or not
  startImmediately: boolean;
  finishedSound?: {
    key: string;
  };
  // Whether multiple buildings can be placed one after another by dragging the mouse - Wall building for example
  canBeDragPlaced: boolean;
};
