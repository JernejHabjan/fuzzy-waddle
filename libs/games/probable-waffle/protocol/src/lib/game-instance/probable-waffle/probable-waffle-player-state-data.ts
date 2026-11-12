import type { BaseData } from "@fuzzy-waddle/platform-game-sessions";
import type { PlayerStateAction } from "../../probable-waffle/probable-waffle-player-state-action";
import type { AIBehaviorTreeStateData } from "./component-data";
import type { PlayerStateResources } from "./player-state-resources";
import type { PlayerStateHousing } from "./player-state-housing";

/**
 * Defines the structured probable waffle player state data contract for this module. Its declared surface
 * makes resources, housing, summary, selection, ai behavior tree state explicit to every consumer. Use this
 * shared shape rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface ProbableWafflePlayerStateData extends BaseData {
  /**
   * resources value carried by {@link ProbableWafflePlayerStateData}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  resources: PlayerStateResources;
  /**
   * housing value carried by {@link ProbableWafflePlayerStateData}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  housing: PlayerStateHousing;
  /**
   * human-facing summary for {@link ProbableWafflePlayerStateData}. It supports UI, narration, or diagnostics
   * and must not be used as the stable identity of the record.
   */
  summary: PlayerStateAction[];
  /**
   * contains GUID from actors' IdComponent
   */
  selection: string[];
  // AI behavior tree state for save/load (AI players only)
  /**
   * Optional discriminator for {@link ProbableWafflePlayerStateData}. It selects the valid branch and behavior,
   * so producers and consumers must keep it synchronized with the accompanying fields.
   */
  aiBehaviorTreeState?: AIBehaviorTreeStateData;
}
