import type { AiAccessGraphV1, AiObservedActorV1, AiObservationV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiDecisionProducerExposureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/ai-decision-producer-exposure-v1";

/** Exact permitted decision inputs. Query status and weapon facts are not producer reachability/exposure proof. */
export interface RuntimeProductionFairInputV1 {
  readonly accessGraph: AiAccessGraphV1 | null;
  readonly accessProducts: AiObservationV1["accessProducts"];
  readonly producerExposure: AiDecisionProducerExposureV1 | null;
  /** Only current visible enemies, with remembered contacts excluded from exposure. */
  readonly visibleThreats: readonly {
    readonly actorId: string;
    readonly observedTick: number;
    readonly position: { readonly x: number; readonly y: number; readonly z: number } | null;
    readonly attacks: Extract<NonNullable<AiObservedActorV1["combatProfile"]>, { status: "known" }>["value"]["attacks"]
      | null;
    /** A threat has no universal range against every building; use producerExposure's exact target pairs. */
    readonly buildingRange: null;
  }[];
}
