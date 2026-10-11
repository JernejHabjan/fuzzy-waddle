
/**
 * Defines the structural player state housing contract. Its declared surface makes current housing, max
 * housing explicit to every consumer. This named alias keeps the boundary explicit without duplicating an
 * anonymous object shape.
 */
export type PlayerStateHousing = {
  /**
   * numeric current housing carried by {@link PlayerStateHousing}. Its units and valid range are defined by
   * {@link PlayerStateHousing} and must remain consistent across producers and consumers.
   */
  currentHousing: number;
  /**
   * numeric max housing carried by {@link PlayerStateHousing}. Its units and valid range are defined by {@link
   * PlayerStateHousing} and must remain consistent across producers and consumers.
   */
  maxHousing: number;
};
