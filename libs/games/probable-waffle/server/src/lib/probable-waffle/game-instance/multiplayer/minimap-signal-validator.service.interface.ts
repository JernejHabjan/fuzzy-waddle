import type { ProbableWaffleGameInstance, ProbableWaffleMinimapSignalEvent } from "@fuzzy-waddle/probable-waffle-protocol";
import type { User } from "@supabase/supabase-js";

/** Server authority for accepting a transient minimap signal before teammate relay. */
export abstract class MinimapSignalValidatorServiceInterface {
  /** Validates sender ownership, map bounds, and the per-player anti-spam interval. */
  abstract validate(event: ProbableWaffleMinimapSignalEvent, gameInstance: ProbableWaffleGameInstance, user: User): boolean;

  /** Releases per-match cooldown state when the match is removed or recreated. */
  abstract cleanup(gameInstanceId: string): void;
}
