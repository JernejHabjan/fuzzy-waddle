import type {
  CampaignDifficulty,
  MissionDifficultyDefinition,
  MissionDifficultyOverrides
} from "../contracts/mission-difficulty-definition";
import type {
  MissionEncounterDefinition,
  MissionEncounterOverride,
  MissionEncounterSpawnGroupDefinition,
  MissionEncounterWaveDefinition
} from "../contracts/mission-encounter-definition";

export interface ResolvedMissionDifficulty extends MissionDifficultyOverrides {
  readonly difficulty: CampaignDifficulty;
  readonly playerCount: number;
}

/** Resolves only exact authored difficulty and player-count patches; it never adapts to runtime performance. */
export function resolveMissionDifficulty(
  definition: MissionDifficultyDefinition,
  difficulty: CampaignDifficulty,
  playerCount: number
): ResolvedMissionDifficulty {
  const playerOverride = definition.playerCountOverrides?.find((override) => override.playerCount === playerCount);
  return {
    ...definition[difficulty],
    ...playerOverride?.[difficulty],
    difficulty,
    playerCount
  };
}

export interface ResolvedMissionEncounterDefinition extends Omit<MissionEncounterDefinition, "waves"> {
  readonly waves: readonly MissionEncounterWaveDefinition[];
  readonly initialDelayTicks: number;
}

/** Applies authored encounter patches and composition scaling into immutable runtime input. */
export function resolveMissionEncounter(
  definition: MissionEncounterDefinition,
  difficulty: ResolvedMissionDifficulty
): ResolvedMissionEncounterDefinition {
  const difficultyPatch = definition.difficultyOverrides?.[difficulty.difficulty];
  const playerPatch = definition.playerCountOverrides?.find(
    (override) => override.playerCount === difficulty.playerCount
  );
  const patch = mergeEncounterOverride(difficultyPatch, playerPatch);
  const scale = patch.waveSizeScale ?? difficulty.waveSizeScale ?? 1;
  const warningTicks = patch.warningTicks ?? difficulty.warningTicks;
  const waves = (patch.waves ?? definition.waves).map((wave) => ({
    ...wave,
    warningTicks: wave.warningTicks ?? warningTicks,
    spawns: scaleSpawnGroups(wave.spawns, scale),
    branches: wave.branches?.map((branch) => ({
      ...branch,
      spawns: scaleSpawnGroups(branch.spawns, scale)
    }))
  }));
  return {
    ...definition,
    initialDelayTicks: patch.initialDelayTicks ?? definition.initialDelayTicks ?? 0,
    waves
  };
}

function mergeEncounterOverride(
  first: MissionEncounterOverride | undefined,
  second: MissionEncounterOverride | undefined
): MissionEncounterOverride {
  return { ...first, ...second };
}

function scaleSpawnGroups(
  groups: readonly MissionEncounterSpawnGroupDefinition[],
  scale: number
): readonly MissionEncounterSpawnGroupDefinition[] {
  return groups.map((group) => ({ ...group, actors: scaleActors(group.actors, scale) }));
}

function scaleActors<TActor extends { readonly scenarioRoleId?: string }>(
  actors: readonly TActor[],
  scale: number
): readonly TActor[] {
  if (actors.length === 0 || scale <= 0) return [];
  const targetCount = Math.max(1, Math.round(actors.length * scale));
  return Array.from({ length: targetCount }, (_, index) => {
    const source = actors[index % actors.length];
    if (!source) throw new Error("Campaign encounter composition unexpectedly became empty");
    return index < actors.length || source.scenarioRoleId === undefined
      ? source
      : ({ ...source, scenarioRoleId: undefined, tags: undefined } as TActor);
  });
}
