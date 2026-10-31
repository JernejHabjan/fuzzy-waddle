import type { ProbableWaffleStateHashDiagnostics } from "@fuzzy-waddle/probable-waffle-protocol";

/**
 * Defines the structured hash snapshot contract for this module. Its declared surface makes hash, diagnostics
 * explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and
 * callers remain compatible.
 */
export interface HashSnapshot {
  /**
   * boolean policy/value on {@link HashSnapshot} that explicitly controls whether the associated behavior is
   * active; do not infer it from unrelated state.
   */
  hash: string;
  /**
   * Optional diagnostics value carried by {@link HashSnapshot}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  diagnostics?: ProbableWaffleStateHashDiagnostics;
}

