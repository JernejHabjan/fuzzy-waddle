import type { AiRuntimePresetQueueApplicationV1 } from "./ai-runtime-preset-queue-application-v1";

/** Independently recorded result of applying a validated preset through authoritative scene services. */
export interface AiRuntimePresetApplicationV1 {
  readonly fixtureId: string;
  readonly sourceRevision: string;
  readonly fixtureDigest: string;
  readonly createdActorNames: readonly string[];
  /** Native role bindings for new actors and explicitly bound inherited actors; this map is not a creation count. */
  readonly createdActorIds: Readonly<Record<string, string>>;
  readonly resourceGrantCount: number;
  readonly resourceStartCount: number;
  readonly queuedItemCount: number;
  /** Actual producer, observation identity, type and product of each item present at the paused tick-zero boundary. */
  readonly initialQueueItems: readonly {
    readonly producerFixtureActorId: string;
    readonly producerActorId: string;
    readonly itemId: string;
    readonly kind: "production" | "research";
    readonly objectName: string | null;
    readonly researchType: string | null;
  }[];
  /** Real admitted commands, queue identities and scoped balances before later explicit resource-start resets. */
  readonly queueApplications: readonly AiRuntimePresetQueueApplicationV1[];
  readonly initialOrderCount: number;
  readonly eventResults: readonly {
    readonly id: string;
    readonly tick: number;
    readonly affectedActors: number;
    readonly subjectName: string;
    /** Native identity actually addressed; null means no live matching original actor remained. */
    readonly affectedActorId?: string | null;
  }[];
}
