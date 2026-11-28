import type { ActorId, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type {
  AiBrainState,
  AiKnowledgeState,
  AiSkirmishState,
  AiSquadState,
  AiThreatIncident
} from "../../../contracts/state/ai-state-contracts";
import type { AiCapabilityCatalog } from "../../../contracts/observation/ai-capability-catalog";
import type { AiAccessNodeId, AiPlanId } from "../../../contracts/ai-core-types";
import type { AiIntent } from "../../../contracts/commands/ai-intent";
import type { AiObservation, AiObservedActor } from "../../../contracts/observation/ai-observation";
import type { AiStrategyAssessment } from "../../../contracts/planning/ai-strategy-assessment";

export interface AiSkirmishProposalContext {
  readonly observation: AiObservation;
  readonly state: AiBrainState;
  readonly catalog: AiCapabilityCatalog;
  readonly combat: readonly AiObservedActor[];
  readonly visibleEnemies: readonly AiObservedActor[];
  readonly rememberedEnemies: readonly AiObservedActor[];
  readonly homeBaseActor: AiObservedActor | undefined;
  readonly home: Vector3Simple | undefined;
  readonly homeAccess: AiAccessNodeId | undefined;
  readonly incidents: readonly AiThreatIncident[];
  readonly liveIncidents: readonly AiThreatIncident[];
  readonly currentQuestion: AiKnowledgeState["questions"][number] | undefined;
  readonly questions: readonly AiKnowledgeState["questions"][number][];
  readonly activeDefense: AiSquadState | undefined;
  readonly activeAttack: AiSquadState | undefined;
  readonly activeScout: AiSquadState | undefined;
  readonly localThreat: AiObservedActor | undefined;
  readonly primaryOwnedActors: Set<ActorId>;
  readonly intents: AiIntent[];
  readonly nextSquads: AiSquadState[];
  skirmish: AiSkirmishState;
  opponent: AiObservedActor | undefined;
  attackPlanId: AiPlanId | undefined;
  assessment: AiStrategyAssessment | undefined;
}
