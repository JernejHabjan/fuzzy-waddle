/**
 * Visual and interaction state for a spell action in {@link ActorAction}.
 *
 * Locked takes precedence over cooldown: an unavailable research must not imply
 * that the player can cast it again once a timer expires.
 */
export type SpellActionAvailability = "ready" | "cooldown" | "locked";

/**
 * Resolves the presentation state from the spell component's authoritative
 * research and cooldown values. The HUD does not own either value.
 */
export function getSpellActionAvailability(isResearched: boolean, cooldownRemaining: number): SpellActionAvailability {
  if (!isResearched) {
    return "locked";
  }

  return cooldownRemaining > 0 ? "cooldown" : "ready";
}
