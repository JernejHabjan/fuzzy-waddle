import type { FactionType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiProfileConfigV1 } from "../contracts/ai-profile-config-v1";

/** Persisted supported opening identity; selection is deterministic and never grants a rules bonus. */
export interface AiOpeningArchetypeV1 {
  readonly id: string;
  readonly version: "opening-archetypes-v1";
  readonly faction: FactionType;
  readonly purpose: "balanced" | "safe" | "pressure";
}

/**
 * Chooses one supported opening from stable lobby-owned facts. The seed is persisted in the brain scheduler,
 * so a load, replay or host replacement cannot silently choose a different personality.
 */
export function selectAiOpeningArchetypeV1(input: {
  readonly faction: FactionType;
  readonly playerNumber: number;
  readonly profile: AiProfileConfigV1;
  readonly seed: number;
}): AiOpeningArchetypeV1 {
  const variants: readonly AiOpeningArchetypeV1["purpose"][] =
    input.profile.difficulty === "easy" ? ["safe"] : input.profile.difficulty === "hard" ? ["pressure", "balanced"] : ["balanced", "safe"];
  const index = Math.abs((input.seed ^ input.playerNumber ^ input.faction) | 0) % variants.length;
  const purpose = variants[index] ?? "balanced";
  return { id: `opening:${input.faction}:${purpose}`, version: "opening-archetypes-v1", faction: input.faction, purpose };
}
