export type ConstructionSiteDefinition = {
  // Whether the building site consumes builders when building is finished
  readonly consumesBuilders: boolean;
  readonly maxAssignedBuilders: number;
  readonly maxAssignedRepairers: number;
  // Factor to multiply all passed building time with, independent of any currently assigned builders
  readonly progressMadeAutomatically: number;
  // Factor to multiply all passed building time with, dependent on the number of builders assigned
  readonly progressMadePerBuilder: number;
  readonly repairFactor: number;
  readonly initialHealthPercentage: number;
  readonly refundFactor: number;
  // Whether to start building immediately after spawn, or not
  readonly startImmediately: boolean;
  readonly finishedSound?: {
    key: string;
  };
  // Whether multiple buildings can be placed one after another by dragging the mouse - Wall building for example
  readonly canBeDragPlaced: boolean;
};
