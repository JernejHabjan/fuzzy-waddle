/** Independently recorded result of applying a validated preset through authoritative scene services. */
export interface AiRuntimePresetApplicationV1 {
  readonly fixtureId: string;
  readonly sourceRevision: string;
  readonly fixtureDigest: string;
  readonly createdActorNames: readonly string[];
  readonly resourceGrantCount: number;
  readonly queuedItemCount: number;
  readonly eventResults: readonly {
    readonly id: string;
    readonly tick: number;
    readonly affectedActors: number;
    readonly subjectName: string;
  }[];
}
