export interface RandomMovementDefinition {
  /**
   * How far (maximum) the entity can go in a single movement
   */
  radius: number;
  shouldPreventMovementStart: () => boolean;
  delay: {
    min: number;
    max: number;
  };
}
