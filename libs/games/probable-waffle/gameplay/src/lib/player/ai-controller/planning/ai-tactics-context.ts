import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiBrainStateV1, AiSquadStateV1, AiSupportStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";
import type { AiProfileConfigV1 } from "../contracts/ai-profile-config-v1";
/** One proposal's shared read-only inputs and owned output accumulators; never persisted. */
export interface AiTacticsContext {
  readonly profile: AiProfileConfigV1;
  readonly observation: AiObservationV1;
  readonly state: AiBrainStateV1;
  readonly catalog: AiCapabilityCatalogV1 | undefined;
  readonly actorById: ReadonlyMap<ActorId, AiObservedActorV1>;
  readonly transportOwned: ReadonlySet<ActorId>;
  readonly visibleEnemies: readonly AiObservedActorV1[];
  readonly claimedActors: Set<ActorId>;
  readonly updates: AiSquadStateV1[];
  readonly intents: AiIntentV1[];
  readonly support: AiSupportStateV1[];
}
