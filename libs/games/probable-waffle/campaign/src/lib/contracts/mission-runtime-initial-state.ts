import type { MissionCounterId, MissionFactId, MissionPhaseId, MissionTimerId } from "./campaign-content-id";

/**
 * Defines the structured mission initial fact contract for this module. Its declared surface makes id, value,
 * debug mutable explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface MissionInitialFact {
  /**
   * stable id used by {@link MissionInitialFact} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  readonly id: MissionFactId;
  /**
   * value value carried by {@link MissionInitialFact}. Its declared type is the compatibility boundary for
   * producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly value: boolean | string;
  /**
   * Optional debug mutable value carried by {@link MissionInitialFact}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly debugMutable?: boolean;
}

/**
 * Defines the structured mission initial counter contract for this module. Its declared surface makes id,
 * value, debug mutable explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface MissionInitialCounter {
  /**
   * stable id used by {@link MissionInitialCounter} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  readonly id: MissionCounterId;
  /**
   * numeric value carried by {@link MissionInitialCounter}. Its units and valid range are defined by {@link
   * MissionInitialCounter} and must remain consistent across producers and consumers.
   */
  readonly value: number;
  /**
   * Optional debug mutable value carried by {@link MissionInitialCounter}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly debugMutable?: boolean;
}

/**
 * Defines the structured mission initial timer contract for this module. Its declared surface makes id,
 * duration ticks, state explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface MissionInitialTimer {
  /**
   * stable id used by {@link MissionInitialTimer} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  readonly id: MissionTimerId;
  /**
   * numeric duration ticks carried by {@link MissionInitialTimer}. Its units and valid range are defined by
   * {@link MissionInitialTimer} and must remain consistent across producers and consumers.
   */
  readonly durationTicks: number;
  /**
   * discriminator for {@link MissionInitialTimer}. It selects the valid branch and behavior, so producers and
   * consumers must keep it synchronized with the accompanying fields.
   */
  readonly state: "running" | "paused";
}

/**
 * Defines the structured mission runtime initial state contract for this module. Its declared surface makes
 * active phase ids, facts, counters, timers explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionRuntimeInitialState {
  /**
   * collection owned by {@link MissionRuntimeInitialState}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly activePhaseIds: readonly MissionPhaseId[];
  /**
   * collection value on {@link MissionRuntimeInitialState}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly facts: readonly MissionInitialFact[];
  /**
   * collection value on {@link MissionRuntimeInitialState}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly counters: readonly MissionInitialCounter[];
  /**
   * collection value on {@link MissionRuntimeInitialState}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly timers: readonly MissionInitialTimer[];
}
