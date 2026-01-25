/**
 * High ground advantage constants for the combat system.
 *
 * Units positioned at a higher z-coordinate than their targets can gain
 * extended attack range based on their weapon type.
 */

/**
 * The minimum z-coordinate difference required for high ground advantage.
 * An attacker must be at least this many z-units above the target to benefit.
 * This value matches the isometric tile height scaling.
 */
export const HIGH_GROUND_THRESHOLD = 64;
