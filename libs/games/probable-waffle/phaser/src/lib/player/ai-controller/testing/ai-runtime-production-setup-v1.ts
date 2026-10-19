import type {
  ActorDefinition,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayerStateData,
  ResearchType,
  GameCommandAuthorityState
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";

/** Actual paused setup, including inherited map actors. Authored future events/fixture labels are deliberately absent. */
export interface AiRuntimeProductionSetupV1 {
  readonly tick: 0;
  readonly seed: readonly string[];
  readonly map: number | string;
  /** Relevant runtime definition content, independent of the caller's Git/fixture label. */
  readonly content: readonly { readonly objectName: string; readonly definition: unknown }[];
  readonly topology: readonly {
    readonly name: string;
    readonly width: number;
    readonly height: number;
    readonly cells: readonly { readonly index: number; readonly collides: boolean; readonly properties: unknown }[];
  }[];
  readonly actors: readonly {
    readonly actorId: string;
    readonly position: Vector3Simple;
    readonly definition: ActorDefinition;
    /** Native paused footprint, including inherited objects. Legacy absence cannot certify constrained placement. */
    readonly footprint?: readonly Vector2Simple[];
  }[];
  readonly players: readonly {
    readonly playerNumber: number;
    readonly controller: ProbableWafflePlayerControllerData;
    readonly state: ProbableWafflePlayerStateData;
    readonly tech: readonly ResearchType[];
  }[];
  readonly commandAuthority: GameCommandAuthorityState;
}
