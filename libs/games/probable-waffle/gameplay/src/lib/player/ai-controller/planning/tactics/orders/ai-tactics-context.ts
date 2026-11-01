import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiBrainState, AiSquadState, AiSupportState } from "../../../contracts/state/ai-state-contracts";
import type { AiCapabilityCatalog } from "../../../contracts/observation/ai-capability-catalog";
import type { AiIntent } from "../../../contracts/commands/ai-intent";
import type { AiObservation, AiObservedActor } from "../../../contracts/observation/ai-observation";
import type { AiProfileConfig } from "../../../contracts/ai-profile-config";
/** One proposal's shared read-only inputs and owned output accumulators; never persisted. */
export interface AiTacticsContext {
  readonly profile: AiProfileConfig;
  readonly observation: AiObservation;
  readonly state: AiBrainState;
  readonly catalog: AiCapabilityCatalog | undefined;
  readonly actorById: ReadonlyMap<ActorId, AiObservedActor>;
  readonly transportOwned: ReadonlySet<ActorId>;
  readonly visibleEnemies: readonly AiObservedActor[];
  readonly claimedActors: Set<ActorId>;
  readonly updates: AiSquadState[];
  readonly intents: AiIntent[];
  readonly support: AiSupportState[];
}
