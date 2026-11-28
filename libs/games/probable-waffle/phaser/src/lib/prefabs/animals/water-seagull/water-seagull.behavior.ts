/** World-space distance at which an ambient seagull reacts to an indexed actor. */
export const WATER_SEAGULL_REACTION_RADIUS_PX = 192;

/** Wall-clock cadence used only by the client-local ambient reaction. */
export const WATER_SEAGULL_REACTION_POLL_MS = 250;

/** Maximum local flight lifetime, which guarantees cleanup even outside a camera view. */
export const WATER_SEAGULL_FLIGHT_TIMEOUT_MS = 3_000;

/** Horizontal travel distance for the one-shot fly-away presentation. */
export const WATER_SEAGULL_FLIGHT_DISTANCE_PX = 480;

/** Consistent screen-space lift applied while the seagull flies away. */
export const WATER_SEAGULL_FLIGHT_LIFT_PX = 160;

/**
 * Chooses the horizontal direction opposite the triggering actor. An actor exactly below the seagull produces a
 * deterministic rightward escape so every client presentation has a stable fallback.
 */
export function getWaterSeagullFlightDirection(seagullX: number, sharkX: number): -1 | 1 {
  return seagullX >= sharkX ? 1 : -1;
}
