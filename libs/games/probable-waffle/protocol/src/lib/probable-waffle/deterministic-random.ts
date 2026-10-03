/**
 * Defines the structured deterministic random state contract for this module. Its declared surface makes
 * schema version, generator state, operation count explicit to every consumer. Use this shared shape rather
 * than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface DeterministicRandomState {
  /**
   * compatibility schema version for {@link DeterministicRandomState}. Consumers use it to choose validation,
   * migration, or conflict-handling rules instead of guessing the payload shape.
   */
  readonly schemaVersion: 1;
  /**
   * discriminator for {@link DeterministicRandomState}. It selects the valid branch and behavior, so producers
   * and consumers must keep it synchronized with the accompanying fields.
   */
  readonly generatorState: string;
  /**
   * numeric bound or quantity carried by {@link DeterministicRandomState}. Interpret it in the owning contract’s
   * units and preserve its validation constraints at boundaries.
   */
  readonly operationCount: number;
}
