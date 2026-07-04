import type { PlayerNumber } from "@fuzzy-waddle/api-interfaces";

export enum ProbableWaffleSceneEventName {
  SceneAwake = "scene-awake",
  Update = "update",
  Shutdown = "shutdown",
  ScoreDamage = "score.damage",
  ScoreUnitProduced = "score.unit_produced",
  ScoreBuildingConstructed = "score.building_constructed",
  LocalConnectionLost = "local-connection-lost",
  ReconnectSnapshotApplied = "reconnect-snapshot-applied",
  DesyncStateChanged = "desync-state-changed",
  DesyncDiagnostics = "desync-diagnostics"
}

export type LocalConnectionLostSceneEvent = {
  playerNumber?: PlayerNumber | null;
  reason?: string;
};

export type ReconnectSnapshotAppliedSceneEvent = {
  reason?: "reconnect" | "spectator-catch-up" | "desync-correction";
  tick?: number;
};
