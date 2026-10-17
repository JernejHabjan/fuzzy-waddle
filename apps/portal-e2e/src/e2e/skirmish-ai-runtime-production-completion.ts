import type { ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeCreatedActorV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-created-actor-v1";

/** Actual created/indexed actor or newly registered tech. No strategic usefulness, stability, fair setup or full event proof. */
export interface RuntimeProductionCompletionV1 {
  readonly completionId: number;
  readonly originatingCommandId: string;
  readonly effectId: string;
  readonly planId: string;
  readonly actorId: string;
  readonly itemId: string;
  readonly requestedSequence: number;
  readonly requestedTick: number;
  readonly scheduledTick: number;
  /** Physical consumed-head removal precedes the authority call; production's terminal may follow an async continuation. */
  readonly removalSequence: number;
  readonly removalTick: number;
  readonly authorityBoundarySequences: readonly [number, number];
  readonly authorityTick: number;
  readonly registeredSequence: number;
  readonly terminalSequence: number;
  readonly terminalTick: number;
  readonly createdActor: AiRuntimeCreatedActorV1 | null;
  readonly researchType: ResearchType | null;
  /** Actual native world link, checked against the separate creation/registration authority. */
  readonly worldLinkId: string;
}
