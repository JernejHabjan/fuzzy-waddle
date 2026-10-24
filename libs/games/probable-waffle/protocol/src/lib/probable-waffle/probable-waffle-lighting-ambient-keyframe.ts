/**
 * Defines the structural probable waffle lighting ambient keyframe contract. Its declared surface makes time,
 * ambient color explicit to every consumer. This named alias keeps the boundary explicit without duplicating
 * an anonymous object shape.
 */
export type ProbableWaffleLightingAmbientKeyframe = {
  /**
   * Normalized cycle position between 0 and 1.
   */
  time: number;
  /**
   * numeric ambient color carried by {@link ProbableWaffleLightingAmbientKeyframe}. Its units and valid range
   * are defined by {@link ProbableWaffleLightingAmbientKeyframe} and must remain consistent across producers and
   * consumers.
   */
  ambientColor: number;
};
