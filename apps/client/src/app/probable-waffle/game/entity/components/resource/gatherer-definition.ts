export type GathererDefinition = {
  // types of gameObjects the gatherer can gather resourcesFrom
  resourceSourceGameObjectClasses: string[];
  // radius in which gameObject will automatically gather resourcesFrom
  resourceSweepRadius: number;
};
