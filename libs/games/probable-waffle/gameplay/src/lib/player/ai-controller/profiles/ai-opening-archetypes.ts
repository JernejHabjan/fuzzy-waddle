import type { FactionType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiProfileConfig } from "../contracts/ai-profile-config";

/** Persisted supported opening identity; selection is deterministic and never grants a rules bonus. */
export interface AiOpeningArchetype {
  readonly id: string;
  readonly version: "opening-archetypes";
  readonly faction: FactionType;
  readonly purpose:
    | "balanced"
    | "rush"
    | "expansion"
    | "macro"
    | "turtle"
    | "turtle_air"
    | "tech"
    | "air_control"
    | "harassment"
    | "naval"
    | "expeditionary";
}

export type AiOpeningPurpose = AiOpeningArchetype["purpose"];

function hashOpeningIdentity(seed: number, playerNumber: number, faction: FactionType): number {
  const identity = `${Number.isSafeInteger(seed) ? seed : 0}|${playerNumber}|${faction}`;
  let hash = 0x811c9dc5;
  for (let index = 0; index < identity.length; index += 1) {
    hash ^= identity.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Chooses one supported opening from stable lobby-owned facts. The resulting archetype id is persisted in brain
 * state; loading or replaying a match therefore preserves its original choice.
 */
export function selectAiOpeningArchetype(input: {
  readonly faction: FactionType;
  readonly playerNumber: number;
  readonly profile: AiProfileConfig;
  readonly seed: number;
  /** Optional runtime capability filter. When loading is incomplete, leave undefined and validate once ready. */
  readonly eligiblePurposes?: readonly AiOpeningPurpose[];
}): AiOpeningArchetype {
  const variants: readonly AiOpeningPurpose[] =
    input.profile.difficulty === "easy"
      ? ["turtle", "balanced"]
      : input.profile.difficulty === "hard"
        ? ["rush", "expansion", "macro", "tech", "turtle_air", "air_control", "harassment", "naval", "expeditionary"]
        : ["balanced", "rush", "expansion", "macro", "tech", "turtle_air", "air_control", "harassment"];
  const eligible = input.eligiblePurposes
    ? variants.filter((purpose) => input.eligiblePurposes!.includes(purpose))
    : variants;
  const pool: readonly AiOpeningPurpose[] = eligible.length > 0 ? eligible : ["balanced"];
  const index = hashOpeningIdentity(input.seed, input.playerNumber, input.faction) % pool.length;
  const purpose = pool[index] ?? "balanced";
  return {
    id: `opening:${input.faction}:${purpose}`,
    version: "opening-archetypes",
    faction: input.faction,
    purpose
  };
}
