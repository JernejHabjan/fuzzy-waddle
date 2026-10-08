import type { BasePlayerControllerData } from "@fuzzy-waddle/platform-game-sessions";
import type { CameraStateData, SelectionGroupData } from "./component-data";
import type { PositionPlayerDefinition } from "./position-player-definition";

/**
 * Defines the structured probable waffle player controller data contract for this module. Its declared surface
 * makes player definition, left or killed, camera state, selection groups explicit to every consumer. Use this
 * shared shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface ProbableWafflePlayerControllerData extends BasePlayerControllerData {
  /**
   * Optional player definition value carried by {@link ProbableWafflePlayerControllerData}. Its declared type is
   * the compatibility boundary for producers, validators, and consumers; do not replace it with a broader
   * inferred shape.
   */
  playerDefinition?: PositionPlayerDefinition;
  /**
   * Optional left or killed value carried by {@link ProbableWafflePlayerControllerData}. Its declared type is
   * the compatibility boundary for producers, validators, and consumers; do not replace it with a broader
   * inferred shape.
   */
  leftOrKilled?: boolean;
  // Camera position for save/load (human players only)
  /**
   * Optional discriminator for {@link ProbableWafflePlayerControllerData}. It selects the valid branch and
   * behavior, so producers and consumers must keep it synchronized with the accompanying fields.
   */
  cameraState?: CameraStateData;
  // Selection groups for save/load (human players only)
  /**
   * Optional collection value on {@link ProbableWafflePlayerControllerData}. Its element type defines the
   * records that may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on
   * it.
   */
  selectionGroups?: SelectionGroupData[];
}
