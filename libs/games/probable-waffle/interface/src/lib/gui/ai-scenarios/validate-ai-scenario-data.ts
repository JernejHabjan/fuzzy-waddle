import type { AiScenarioCatalog } from "./ai-scenario-catalog";
import type { AiScenarioRecipe } from "./ai-scenario-recipe";

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const optionalText = (value: unknown): boolean => value === null || typeof value === "string";
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(text);

/** Reject malformed staged catalog data before signals and asset paths consume it. */
export function isAiScenarioCatalog(value: unknown): value is AiScenarioCatalog {
  return (
    record(value) &&
    text(value.sourceRevision) &&
    Array.isArray(value.scenarios) &&
    value.scenarios.every(
      (entry) =>
        record(entry) &&
        text(entry.id) &&
        text(entry.title) &&
        text(entry.group) &&
        optionalText(entry.setup) &&
        optionalText(entry.outcome) &&
        optionalText(entry.unavailable) &&
        (entry.recipe === null ||
          (record(entry.recipe) &&
            typeof entry.recipe.name === "string" &&
            /^recipe-\d+\.json$/.test(entry.recipe.name) &&
            text(entry.recipe.digest)))
    )
  );
}

/** Validate the browser-consumed recipe shape; the existing runtime guard validates each preset at launch. */
export function isAiScenarioRecipe(value: unknown): value is AiScenarioRecipe {
  if (!record(value) || !text(value.purpose) || !strings(value.scenarioIds) || !record(value.recipe)) return false;
  if (
    value.acceptance !== undefined &&
    (!record(value.acceptance) ||
      ["setup", "actions", "measurements", "required", "forbidden", "branches"].some(
        (key) =>
          value.acceptance &&
          record(value.acceptance) &&
          value.acceptance[key] !== undefined &&
          !strings(value.acceptance[key])
      ))
  )
    return false;
  const recipe = value.recipe;
  return (
    text(recipe.mapLabel) &&
    Number.isSafeInteger(recipe.aiPlayerNumber) &&
    Array.isArray(recipe.variants) &&
    (recipe.requiresMultiplayer === undefined || typeof recipe.requiresMultiplayer === "boolean") &&
    recipe.variants.every(
      (variant: unknown) =>
        record(variant) &&
        text(variant.id) &&
        Number.isSafeInteger(variant.seed) &&
        ["Tivara", "Skaduwee"].includes(String(variant.aiFaction)) &&
        ["Tivara", "Skaduwee"].includes(String(variant.humanFaction)) &&
        ["Easy", "Normal", "Hard"].includes(String(variant.difficulty)) &&
        (variant.scenarioIds === undefined || strings(variant.scenarioIds)) &&
        (variant.mapLabel === undefined || text(variant.mapLabel)) &&
        (variant.requiresMultiplayer === undefined || typeof variant.requiresMultiplayer === "boolean") &&
        (variant.setupRationale === undefined || typeof variant.setupRationale === "string") &&
        (variant.lobbyTeams === undefined ||
          (Array.isArray(variant.lobbyTeams) &&
            variant.lobbyTeams.every(
              (player: unknown) =>
                record(player) && Number.isSafeInteger(player.playerNumber) && Number.isSafeInteger(player.team)
            ))) &&
        (variant.additionalAiPlayers === undefined ||
          (Array.isArray(variant.additionalAiPlayers) &&
            variant.additionalAiPlayers.every(
              (player: unknown) =>
                record(player) &&
                Number.isSafeInteger(player.playerNumber) &&
                ["Tivara", "Skaduwee"].includes(String(player.faction)) &&
                ["Easy", "Normal", "Hard"].includes(String(player.difficulty))
            ))) &&
        (variant.perturbations === undefined || Array.isArray(variant.perturbations))
    )
  );
}
