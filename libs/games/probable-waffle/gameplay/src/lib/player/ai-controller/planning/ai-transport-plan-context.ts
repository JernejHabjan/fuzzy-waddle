import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiAccessGraph } from "../contracts/ai-access-graph";
import type { AiBrainState } from "../contracts/ai-brain-state";
import type { AiCapabilityCatalog } from "../contracts/ai-capability-catalog";
import type { AiIntent } from "../contracts/ai-intent";
import type { AiObservation } from "../contracts/ai-observation";

export interface AiTransportPlanContext {
  readonly observation: AiObservation;
  readonly state: AiBrainState;
  readonly graph: AiAccessGraph | undefined;
  readonly catalog: AiCapabilityCatalog | undefined;
  readonly intents: AiIntent[];
  readonly reasons: string[];
  readonly occupiedActors: Set<ActorId>;
  readonly occupiedTransfers: Set<string>;
  readonly occupiedDestinations: Set<string>;
}
