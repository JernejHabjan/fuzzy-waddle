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

/**
 * Defines the structured resolved mission difficulty contract for this module. Its declared surface makes
 * difficulty, player count explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface ResolvedMissionDifficulty extends MissionDifficultyOverrides {
  /**
   * difficulty value carried by {@link ResolvedMissionDifficulty}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly difficulty: CampaignDifficulty;
  /**
   * numeric bound or quantity carried by {@link ResolvedMissionDifficulty}. Interpret it in the owning
   * contract’s units and preserve its validation constraints at boundaries.
   */
  readonly playerCount: number;
}

/** Documents the resolve mission difficulty member and its declared contract at this boundary. */
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

/**
 * Defines the structured resolved mission encounter definition contract for this module. Its declared surface
 * makes waves, initial delay ticks explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
export interface ResolvedMissionEncounterDefinition extends Omit<MissionEncounterDefinition, "waves"> {
  /**
   * collection value on {@link ResolvedMissionEncounterDefinition}. Its element type defines the records that
   * may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly waves: readonly MissionEncounterWaveDefinition[];
  /**
   * numeric initial delay ticks carried by {@link ResolvedMissionEncounterDefinition}. Its units and valid range
   * are defined by {@link ResolvedMissionEncounterDefinition} and must remain consistent across producers and
   * consumers.
   */
  readonly initialDelayTicks: number;
}

/** Documents the resolve mission encounter member and its declared contract at this boundary. */
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
