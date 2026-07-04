/**
 * Shared lifecycle states for one game session.
 *
 * These states are broadcast through `gameInstanceMetadata.sessionState` and are
 * consumed by both Angular routing and Phaser scene/HUD state handlers.
 */
export enum GameSessionState {
  /**
   * Lobby/setup phase before the match has been launched.
   * Triggered when a game instance is created or returned to an unstarted state.
   */
  NotStarted,
  /**
   * The host has started the match and clients should move from lobby UI into
   * the game scenes. World scenes pause here until every human player is ready.
   */
  MovingPlayersToGame,
  /**
   * The ready barrier has opened and the match is about to begin.
   * In multiplayer this is the short synchronized countdown window before
   * simulation resumes; in local modes it can advance immediately.
   */
  StartingTheGame,
  /**
   * Active gameplay.
   * Triggered after the start countdown completes and the simulation is allowed
   * to run normally.
   */
  InProgress,
  /**
   * Match-complete score-screen transition.
   * Triggered only when the match has resolved for every remaining participant.
   *
   * Typical examples:
   * - the last surviving player hits a win condition, so all opponents are
   *   resolved as losses and the whole session moves to score screen
   * - the current player hits a lose condition and the remaining active
   *   opponents are resolved as winners
   * - a tie condition ends the match for everyone at once
   *
   * Important: a single player quitting should not broadcast this state for the
   * whole match. Quit uses a local-only redirect for that player while the
   * remaining players continue until one of the global match-end outcomes above
   * is reached.
   */
  ToScoreScreen,
  /**
   * Terminal cleanup state after a match instance is being torn down.
   * Triggered when the session is explicitly stopped or no human players remain.
   */
  Stopped
}
