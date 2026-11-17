import { environment } from "@fuzzy-waddle/environments/environment";
import {
  FactionType,
  ProbableWaffleAiDifficulty,
  ProbableWaffleGameInstanceType,
  ProbableWaffleGameInstanceVisibility,
  ProbableWaffleLevels,
  ProbableWafflePlayerType,
  createPlayerLobbyDefinition,
  type PositionPlayerDefinition
} from "@fuzzy-waddle/probable-waffle-protocol";
import { isAiRuntimeBrowserTestConfig } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/browser/validate-ai-runtime-browser-test-config";
import type { GameInstanceClientServiceInterface } from "../../communicators/game-instance-client.service.interface";
import type { AiRuntimeBrowserTestConfig } from "../main/ai-runtime-browser-test-host";
import { activeAiScenarios } from "./active-ai-scenario";
import type { AiScenarioEntry } from "./ai-scenario-catalog";
import type { AiScenarioRecipe, AiScenarioVariant } from "./ai-scenario-recipe";

const difficulty = {
  Easy: ProbableWaffleAiDifficulty.Easy,
  Normal: ProbableWaffleAiDifficulty.Medium,
  Hard: ProbableWaffleAiDifficulty.Hard
} satisfies Record<AiScenarioVariant["difficulty"], ProbableWaffleAiDifficulty>;

// The matrix invokes separate save, replay, transport or debug drivers for these cases.
const driverOnly = new Set([
  "D-02",
  "DBG-01",
  "DBG-03",
  "DBG-04",
  "DBG-05",
  "DBG-06",
  "H-08",
  "H-09",
  "H-31",
  "H-32",
  "SEQ-08"
]);

export function scenarioMapLabel(recipe: AiScenarioRecipe, variant: AiScenarioVariant): string {
  return variant.mapLabel ?? recipe.recipe.mapLabel;
}

/** Browser previews require a complete local match whose scripted events are owned by the preset itself. */
export function scenarioPlaybackBlocker(
  id: string,
  recipe: AiScenarioRecipe,
  variant: AiScenarioVariant
): string | null {
  if (variant.requiresMultiplayer ?? recipe.recipe.requiresMultiplayer) return "Requires multiple browser clients.";
  if (variant.perturbations?.length || driverOnly.has(id))
    return "Requires additional actions from the automated runner.";
  if (!Object.values(ProbableWaffleLevels).some((map) => map.name === scenarioMapLabel(recipe, variant))) {
    return "The authored map is unavailable.";
  }
  return null;
}

/** Boot the ordinary local game with the fixture attached to that match only. */
export async function launchAiScenario(
  client: GameInstanceClientServiceInterface,
  scenario: AiScenarioEntry,
  recipe: AiScenarioRecipe,
  variant: AiScenarioVariant,
  sourceRevision: string,
  signal: AbortSignal
): Promise<void> {
  if (environment.production || scenarioPlaybackBlocker(scenario.id, recipe, variant) || !scenario.recipe) {
    throw new Error("This scenario cannot be played in the browser.");
  }
  const map = Object.values(ProbableWaffleLevels).find((level) => level.name === scenarioMapLabel(recipe, variant));
  if (!map) throw new Error("The scenario map is unavailable.");
  const config = {
    schemaVersion: 1,
    enabled: true,
    startPaused: true,
    seed: variant.seed,
    ...(variant.presetWorld
      ? {
          presetWorld: { ...variant.presetWorld, provenance: { sourceRevision, fixtureDigest: scenario.recipe.digest } }
        }
      : {}),
    ...(variant.presetWorld?.protectedRoutes ? { captureProduction: true } : {})
  } satisfies AiRuntimeBrowserTestConfig;
  if (!isAiRuntimeBrowserTestConfig(config)) throw new Error("The scenario preset is invalid.");

  signal.throwIfAborted();
  const title = `${scenario.id} · ${variant.id}`;
  await client.createGameInstance(
    title,
    ProbableWaffleGameInstanceVisibility.Private,
    ProbableWaffleGameInstanceType.InstantGame,
    { localOnly: true }
  );
  const match = client.gameInstance;
  if (!match) throw new Error("The local match could not be created.");
  const ensureMatch = () => {
    signal.throwIfAborted();
    if (client.gameInstance !== match) throw new Error("The local match was replaced.");
  };
  ensureMatch();
  const team = (playerNumber: number) =>
    variant.lobbyTeams?.find((player) => player.playerNumber === playerNumber)?.team;
  await client.playerSlotOpened({
    player: { ...createPlayerLobbyDefinition(1, 0, "Scenario opponent"), joined: false },
    playerType: ProbableWafflePlayerType.NetworkOpen,
    factionType: FactionType[variant.humanFaction],
    team: team(1)
  } satisfies PositionPlayerDefinition);
  ensureMatch();
  await client.addSelfAsSpectator();
  ensureMatch();
  await client.gameModeChanged("map", { map: map.id });
  ensureMatch();
  const players = [
    { playerNumber: recipe.recipe.aiPlayerNumber, faction: variant.aiFaction, difficulty: variant.difficulty },
    ...(variant.additionalAiPlayers ?? [])
  ].sort((left, right) => left.playerNumber - right.playerNumber);
  for (const player of players) {
    ensureMatch();
    const ai = await client.addAiPlayer(undefined, {
      factionType: FactionType[player.faction],
      team: team(player.playerNumber),
      difficulty: difficulty[player.difficulty]
    });
    if (ai.player.playerNumber !== player.playerNumber)
      throw new Error("The scenario player slots could not be assigned.");
  }
  ensureMatch();
  activeAiScenarios.set(match, { title, config });
  try {
    await client.startGame();
  } catch (error) {
    activeAiScenarios.delete(match);
    throw error;
  }
}
