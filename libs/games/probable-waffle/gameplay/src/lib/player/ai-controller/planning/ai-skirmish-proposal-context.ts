import type { ActorId, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type {
  AiBrainStateV1,
  AiKnowledgeStateV1,
  AiSkirmishStateV1,
  AiSquadStateV1,
  AiThreatIncidentV1
} from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiAccessNodeId, AiPlanId } from "../contracts/ai-core-types";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1, AiObservedActorV1 } from "../contracts/ai-observation-v1";

export interface AiSkirmishProposalContext {
  readonly observation: AiObservationV1;
  readonly state: AiBrainStateV1;
  readonly catalog: AiCapabilityCatalogV1;
  readonly combat: readonly AiObservedActorV1[];
  readonly visibleEnemies: readonly AiObservedActorV1[];
  readonly rememberedEnemies: readonly AiObservedActorV1[];
  readonly homeBaseActor: AiObservedActorV1 | undefined;
  readonly home: Vector3Simple | undefined;
  readonly homeAccess: AiAccessNodeId | undefined;
  readonly incidents: readonly AiThreatIncidentV1[];
  readonly liveIncidents: readonly AiThreatIncidentV1[];
  readonly currentQuestion: AiKnowledgeStateV1["questions"][number] | undefined;
  readonly questions: readonly AiKnowledgeStateV1["questions"][number][];
  readonly activeDefense: AiSquadStateV1 | undefined;
  readonly activeAttack: AiSquadStateV1 | undefined;
  readonly activeScout: AiSquadStateV1 | undefined;
  readonly localThreat: AiObservedActorV1 | undefined;
  readonly primaryOwnedActors: Set<ActorId>;
  readonly intents: AiIntentV1[];
  readonly nextSquads: AiSquadStateV1[];
  skirmish: AiSkirmishStateV1;
  opponent: AiObservedActorV1 | undefined;
  attackPlanId: AiPlanId | undefined;
}
