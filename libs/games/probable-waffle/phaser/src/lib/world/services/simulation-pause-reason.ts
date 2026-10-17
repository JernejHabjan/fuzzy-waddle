/**
 * Defines the closed simulation pause reason classification. Use an explicit member rather than a free-form
 * string so branching, persistence, and diagnostics share the same vocabulary.
 */
export enum SimulationPauseReason {
  /**
   * Selects the `Manual` case of {@link SimulationPauseReason}. Use this explicit member when the surrounding
   * flow requires this distinct policy or state; never substitute a free-form string.
   */
  Manual = "manual",
  /**
   * Selects the `SceneBootstrap` case of {@link SimulationPauseReason}. Use this explicit member when the
   * surrounding flow requires this distinct policy or state; never substitute a free-form string.
   */
  SceneBootstrap = "scene-bootstrap",
  /**
   * Selects the `Lockstep` case of {@link SimulationPauseReason}. Use this explicit member when the surrounding
   * flow requires this distinct policy or state; never substitute a free-form string.
   */
  Lockstep = "lockstep",
  /**
   * Selects the `Reconnect` case of {@link SimulationPauseReason}. Use this explicit member when the surrounding
   * flow requires this distinct policy or state; never substitute a free-form string.
   */
  Reconnect = "reconnect",
  /**
   * Selects the `SnapshotRestore` case of {@link SimulationPauseReason}. Use this explicit member when the
   * surrounding flow requires this distinct policy or state; never substitute a free-form string.
   */
  SnapshotRestore = "snapshot-restore",
  /**
   * Selects the `Desync` case of {@link SimulationPauseReason}. Use this explicit member when the surrounding
   * flow requires this distinct policy or state; never substitute a free-form string.
   */
  Desync = "desync",
  /**
   * Selects the `DesyncCorrection` case of {@link SimulationPauseReason}. Use this explicit member when the
   * surrounding flow requires this distinct policy or state; never substitute a free-form string.
   */
  DesyncCorrection = "desync-correction",
  /**
   * Selects the `Player` case of {@link SimulationPauseReason}. Use this explicit member when the surrounding
   * flow requires this distinct policy or state; never substitute a free-form string.
   */
  Player = "player",
  /**
   * Selects the `ExternalModal` case of {@link SimulationPauseReason}. Use this explicit member when the
   * surrounding flow requires this distinct policy or state; never substitute a free-form string.
   */
  ExternalModal = "external-modal",
  /**
   * Selects the `CampaignCinematic` case of {@link SimulationPauseReason}. Use this explicit member when the
   * surrounding flow requires this distinct policy or state; never substitute a free-form string.
   */
  CampaignCinematic = "campaign-cinematic",
  /**
   * Selects the `CampaignRuntimeFailure` case of {@link SimulationPauseReason}. Use this explicit member when
   * the surrounding flow requires this distinct policy or state; never substitute a free-form string.
   */
  CampaignRuntimeFailure = "campaign-runtime-failure",
  /**
   * Selects the `CampaignRestore` case of {@link SimulationPauseReason}. Use this explicit member when the
   * surrounding flow requires this distinct policy or state; never substitute a free-form string.
   */
  CampaignRestore = "campaign-restore"
}
