import type { AiAccessGraph, AiObservedActor, AiObservation } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiDecisionProducerExposure } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/ai-decision-producer-exposure";

/** Exact permitted decision inputs. Query status and weapon facts are not producer reachability/exposure proof. */
export interface RuntimeProductionFairInput {
  readonly accessGraph: AiAccessGraph | null;
  readonly accessProducts: AiObservation["accessProducts"];
  readonly producerExposure: AiDecisionProducerExposure | null;
  /** Only current visible enemies, with remembered contacts excluded from exposure. */
  readonly visibleThreats: readonly {
    readonly actorId: string;
    readonly observedTick: number;
    readonly position: { readonly x: number; readonly y: number; readonly z: number } | null;
    readonly attacks: Extract<NonNullable<AiObservedActor["combatProfile"]>, { status: "known" }>["value"]["attacks"]
      | null;
    /** A threat has no universal range against every building; use producerExposure's exact target pairs. */
    readonly buildingRange: null;
  }[];
}
