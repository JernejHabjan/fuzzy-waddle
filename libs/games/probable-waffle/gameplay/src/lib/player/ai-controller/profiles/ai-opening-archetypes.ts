import type { FactionType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiProfileConfig } from "../contracts/ai-profile-config";

/** Persisted supported opening identity; selection is deterministic and never grants a rules bonus. */
export interface AiOpeningArchetype {
  readonly id: string;
  readonly version: "opening-archetypes";
  readonly faction: FactionType;
  readonly purpose: "balanced" | "rush" | "macro" | "turtle" | "tech" | "air_control" | "naval" | "expeditionary";
}

/**
 * Chooses one supported opening from stable lobby-owned facts. The seed is persisted in the brain scheduler,
 * so a load, replay or host replacement cannot silently choose a different personality.
 */
export function selectAiOpeningArchetype(input: {
  readonly faction: FactionType;
  readonly playerNumber: number;
  readonly profile: AiProfileConfig;
  readonly seed: number;
}): AiOpeningArchetype {
  const variants: readonly AiOpeningArchetype["purpose"][] =
    input.profile.difficulty === "easy"
      ? ["turtle", "balanced"]
      : input.profile.difficulty === "hard"
        ? ["rush", "macro", "tech", "air_control", "naval", "expeditionary"]
        : ["balanced", "macro", "tech", "air_control"];
  const index = Math.abs((input.seed ^ input.playerNumber ^ input.faction) | 0) % variants.length;
  const purpose = variants[index] ?? "balanced";
  return {
    id: `opening:${input.faction}:${purpose}`,
    version: "opening-archetypes",
    faction: input.faction,
    purpose
  };
}
