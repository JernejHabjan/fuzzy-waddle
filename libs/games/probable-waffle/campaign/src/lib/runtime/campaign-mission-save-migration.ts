import type { CampaignMissionRuntimeState } from "@fuzzy-waddle/probable-waffle-protocol";
import type { MissionRevisionMigration } from "../contracts/mission-revision-migration";

/** Applies only author-declared identifier renames; missing revision links intentionally reject the save. */
export function migrateCampaignMissionRevision(
  source: CampaignMissionRuntimeState,
  targetRevision: number,
  migrations: readonly MissionRevisionMigration[]
): CampaignMissionRuntimeState | undefined {
  let state = structuredClone(source);
  const visited = new Set<number>();
  while (state.missionRevision !== targetRevision) {
    if (visited.has(state.missionRevision)) return undefined;
    visited.add(state.missionRevision);
    const migration = migrations.find((candidate) => candidate.fromRevision === state.missionRevision);
    if (!migration || migration.toRevision <= migration.fromRevision || migration.toRevision > targetRevision)
      return undefined;
    state = {
      ...state,
      missionRevision: migration.toRevision,
      activePhaseIds: renameList(state.activePhaseIds, migration.renamePhaseIds),
      completedPhaseIds: renameList(state.completedPhaseIds, migration.renamePhaseIds),
      pendingPhaseIds: renameList(state.pendingPhaseIds, migration.renamePhaseIds),
      objectives: renameRecord(state.objectives, migration.renameObjectiveIds),
      facts: renameRecord(state.facts, migration.renameFactIds),
      counters: renameRecord(state.counters, migration.renameCounterIds)
    };
  }
  return state;
}

function renameList(values: readonly string[], renames?: Readonly<Record<string, string>>): string[] {
  return values.map((value) => renames?.[value] ?? value);
}

function renameRecord<T>(
  values: Readonly<Record<string, T>>,
  renames?: Readonly<Record<string, string>>
): Record<string, T> {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [renames?.[key] ?? key, value]));
}
