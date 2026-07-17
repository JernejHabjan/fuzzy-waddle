export type GathererDefinition = {
  // types of gameObjects the gatherer can gather resourcesFrom
  readonly resourceSourceGameObjectClasses: string[];
  // radius in which gameObject will automatically gather resourcesFrom
  readonly resourceSweepRadius: number;
};
