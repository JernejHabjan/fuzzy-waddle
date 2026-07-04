import { MovementTerrainType } from "./movement-terrain-type";

export interface ActorTranslateDefinition {
  /**
   * Tile move duration specifies how long (in ms) unit requires to cross 1 tile
   */
  tileMoveDuration?: number;
  /**
   * Defines what terrain this unit can traverse.
   * Defaults to Ground if not set.
   * Flying units (FlyingComponent) bypass this entirely.
   */
  movementTerrainType?: MovementTerrainType;
}
