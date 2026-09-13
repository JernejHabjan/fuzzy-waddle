import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiAccessGraphV1 } from "../contracts/ai-access-graph-v1";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";

export interface AiTransportPlanContext {
  readonly observation: AiObservationV1;
  readonly state: AiBrainStateV1;
  readonly graph: AiAccessGraphV1 | undefined;
  readonly catalog: AiCapabilityCatalogV1 | undefined;
  readonly intents: AiIntentV1[];
  readonly reasons: string[];
  readonly occupiedActors: Set<ActorId>;
  readonly occupiedTransfers: Set<string>;
  readonly occupiedDestinations: Set<string>;
}
