# Issue 734: improve game options

## Status

- [x] Classified as a decision/research change, then promoted to runtime delivery after product approval.
- [x] Audited the existing settings UI, persistence, Phaser consumers, replay archive,
      campaign dialogue, chat filtering, camera, HUD, lockstep clock, and fog of war.
- [x] Separated personal preferences from match-authoritative rules.
- [x] Confirm D1–D7: deliver all; preserve required dialogue; preserve original chat text; SC2-style rolling APM;
      discrete camera distances; single-player-only speed; host-owned visibility.
- [x] Implement the approved runtime stages and focused automated verification.
- [ ] Complete the two-client manual visibility/ping/reconnect smoke test in a configured multiplayer environment.

## Implementation update (2026-08-15)

- [x] Added versioned database-synchronized personal preferences with local storage only as the anonymous,
      offline, and failed-sync fallback. Pending local changes upload after sign-in; otherwise the remote profile wins.
- [x] Added typed live setting events and the expanded OnPush options surface.
- [x] Wired camera defaults/limits, opt-in replay archives, and Slow/Normal/Fast single-player defaults.
- [x] Added a Phaser Editor-backed diagnostics prefab owned by `HudProbableWaffle` for command-echo ping,
      rolling 60-second committed-command APM, render FPS, and deterministic elapsed time.
- [x] Preserved original chat text beside the server-filtered presentation field; the default-on client preference
      selects the filtered copy without mutating the original transport message.
- [x] Kept required campaign dialogue and progression UI visible regardless of the future voiced-subtitle preference.
- [x] Added host-only terrain visibility rules and initialized fog from the resolved shared game-mode value.
- [x] Kept multiplayer speed fixed at Normal.

## Goal

Give Probable Waffle the useful Warcraft III option set named in [issue
#734](https://github.com/JernejHabjan/fuzzy-waddle/issues/734), while keeping the
current visual design. Settings must be persisted and connected to their actual runtime
owners; controls that cannot safely affect the game must not be presented as working.

## Evidence from the current repository

| Area                 | Current behavior                                                                                                                                                                                       | Consequence                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Settings persistence | `GameSettings` is a local-storage class with per-property fallback, and `GameOptionsService` publishes one broad `game` change event.                                                                  | New personal preferences fit here, but payloads should become typed before adding several live consumers.                                                         |
| Options UI           | `OptionsComponent` edits volume, cursor lock, edge scrolling, lighting, and home background.                                                                                                           | This is the owner for personal preferences, not match rules.                                                                                                      |
| Replays              | `ReplayRecorderService` records every non-replay session and persists it on shutdown.                                                                                                                  | “Automatically save replays: false” changes today’s effective default and needs an explicit persistence gate.                                                     |
| Profanity            | `TextSanitizationService` cleans chat text on the server before clients receive it.                                                                                                                    | A client preference cannot disable filtering because the original message no longer reaches the client.                                                           |
| Camera               | `CameraMovementHandler` uses hard-coded zoom steps `[0.5, 1, 2, 4, 8]`, initializes independently of a preferred zoom, and restores save-game camera state.                                            | Camera sliders need named bounds, an initial preference, and an explicit precedence rule for loaded saves and cinematics.                                         |
| HUD metrics          | No player HUD surface currently owns ping, APM, FPS, or elapsed-time labels. Phaser exposes render FPS and the game exposes deterministic simulation ticks, but no round-trip latency provider exists. | One scene-backed diagnostics HUD should own the optional labels; ping needs transport instrumentation first.                                                      |
| Subtitles            | Campaign dialogue is projected into `CampaignCinematicHud` and is currently essential text, acknowledgement UI, and searchable history rather than a duplicate of voice audio.                         | Hiding it now can make campaign content inaccessible or impossible to advance.                                                                                    |
| Game speed           | `GameSpeedModifier` already offers 1x/3x/10x/100x. It scales deterministic ticks only in single-player; multiplayer is deliberately held at 1x.                                                        | A default speed preference can be single-player-only. Multiplayer game speed is a match rule and needs protocol/server authority.                                 |
| Visibility           | `FogOfWarComponent` already supports full exploration, pre-explored terrain, and all-visible modes, with campaign overrides.                                                                           | The WC3 choices map well to existing runtime modes, but visibility must be selected by the host/map and shared by the match, not stored as a personal preference. |

## Product model

### Personal persisted preferences

These belong in the existing options screen and the authenticated user profile. Local storage is only the
anonymous/offline fallback and synchronization retry source.

| Preference                  | Recommended default        | Runtime owner                                                                |
| --------------------------- | -------------------------- | ---------------------------------------------------------------------------- |
| Automatically save replays  | Off                        | `ReplayRecorderService` persistence policy                                   |
| Profanity filter            | On                         | Client chat presentation after the protocol can safely carry filterable text |
| Show ping                   | Off                        | Diagnostics HUD plus a transport RTT provider                                |
| Show actions per minute     | Off                        | Diagnostics HUD plus a local committed-action counter                        |
| Show FPS                    | Off                        | Diagnostics HUD using Phaser’s measured render FPS                           |
| Show time elapsed           | Off                        | Diagnostics HUD using deterministic simulation ticks                         |
| Default camera distance     | Current 1x view            | `CameraMovementHandler` initial camera setup                                 |
| Maximum camera distance     | Current farthest 0.5x view | `CameraMovementHandler` zoom clamp                                           |
| Enable subtitles            | On                         | Campaign presentation, once dialogue and subtitles are distinct concepts     |
| Default single-player speed | Normal (1x)                | Existing speed controller and deterministic tick service                     |

### Match-authoritative options

These belong in host/lobby setup and game-instance metadata. Every participant must receive
the same value before simulation starts.

| Match option | Recommended values                                  | Runtime mapping                                                                                                                                         |
| ------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Game speed   | Slow, Normal, Fast                                  | One protocol enum mapped to an approved tick cadence for all peers; replays store the selected rule.                                                    |
| Visibility   | Default, Hide Terrain, Map Explored, Always Visible | Default resolves the map/campaign policy; Hide Terrain maps to full exploration; Map Explored maps to pre-explored; Always Visible maps to all-visible. |

“Default” must resolve to an explicit mode at launch so saves, reconnects, spectators, and
replays do not depend on a later local default.

## Affected code map

- Personal settings and migration: `libs/games/probable-waffle/phaser/src/lib/core/gameSettings.ts`
  and `game-options.service.ts`.
- Angular controls: `libs/games/probable-waffle/interface/src/lib/gui/options/`.
- Camera behavior: `libs/games/probable-waffle/phaser/src/lib/player/human-controller/cameraMovementHandler.ts`.
- Replay capture: `libs/games/probable-waffle/phaser/src/lib/world/services/replay/` and the
  game-save port in probable-waffle gameplay/interface.
- HUD metrics and game speed: `libs/games/probable-waffle/phaser/src/lib/world/scenes/hud-scenes/`,
  `prefabs/gui/`, `command-bus.service.ts`, and `simulation-tick.service.ts`.
- Subtitles: campaign presentation services plus `prefabs/gui/campaign/CampaignCinematicHud`.
- Profanity filtering: `libs/platform/chat/src/lib/server/content-filters/` and the chat
  transport/presentation contracts.
- Visibility and multiplayer speed: probable-waffle protocol game-instance start options,
  interface host/lobby controls, server creation validation, and `fog-of-war.component.ts`.

## Recommended implementation stages

### Stage 1: typed settings foundation and options UI

- [x] Define documented, typed personal-setting contracts and a closed change-event union.
- [x] Add defaults and backward-compatible local-storage hydration for all approved personal preferences.
- [ ] Move the options component to OnPush reactive state/forms while preserving its existing in-game modal contract.
- [x] Group options by gameplay, camera, interface/diagnostics, accessibility, and replay behavior without copying WC3 styling.
- [x] Use accessible checkboxes and range/select controls with visible values and help text where behavior is not obvious.
- [x] Add focused `GameSettings`, `OptionsService`, and `OptionsComponent` tests for defaults, legacy hydration,
      local fallback, chat presentation, and rendered controls. Full event/HTTP integration coverage remains follow-up hardening.

Acceptance criteria:

- Existing saved settings still load.
- Every visible control persists and emits a typed change notification.
- No match-authoritative setting is written to personal local storage.

### Stage 2: camera preferences

- [x] Replace misleading hard-coded min/max names with documented zoom/distance configuration.
- [x] Apply default distance only when starting a fresh game; restored save camera state takes precedence.
- [x] Clamp wheel zoom and restored values to the configured maximum distance.
- [x] Apply maximum-distance changes live, then recalculate/clamp camera bounds.
- [ ] Add handler tests for initial preference, wheel limits, live changes, save restore, small-map bounds, and cleanup.

Acceptance criteria:

- The default slider changes a fresh game’s initial view.
- The maximum-distance slider prevents farther zoom-out without breaking map bounds.
- Loading a save preserves its camera state, clamped only when it exceeds the current allowed range.

### Stage 3: replay autosave

- [x] Inject/read the approved replay preference at recorder initialization.
- [x] Skip automatic archive persistence when disabled without affecting replay playback.
- [x] Apply replay preference changes to the next match for predictable capture ownership.
- [ ] Add recorder tests for default-off, enabled persistence, replay playback sessions, missing save ports, and shutdown idempotence.

Acceptance criteria:

- A default installation creates no replay save on match shutdown.
- Enabling autosave creates exactly one compatible replay archive.

### Stage 4: optional diagnostics HUD

- [x] Add one Phaser Editor-backed HUD prefab for enabled metrics; do not scatter labels through the main HUD scene.
- [x] Show elapsed time from `SimulationTickService.currentTick`, excluding paused/stalled simulation time.
- [x] Show FPS from Phaser’s measured render loop with a throttled display refresh.
- [x] Define APM as locally owned gameplay commands committed to the canonical command stream per rolling 60 seconds; exclude camera, selection-only, chat, and UI actions.
- [x] Measure transport RTT from the authoritative Socket.IO command echo and display unavailable states explicitly.
- [x] Subscribe to typed setting changes and release subscriptions/timers on HUD shutdown.
- [ ] Add unit tests for metric calculation, toggle changes, unavailable ping, reconnect, pause/stall behavior, and cleanup; add a scene smoke test for layout.

Acceptance criteria:

- Each metric is hidden by default and toggles live.
- Enabling metrics does not mutate deterministic game state or generate commands.
- APM and elapsed time remain replay/lockstep coherent; FPS and ping remain explicitly local diagnostics.

### Stage 5: subtitles and profanity filtering

- [ ] Split authored dialogue text from optional subtitles before allowing subtitle text to be hidden.
- [x] Keep required dialogue, acknowledgement, skip controls, and history accessible when subtitles are disabled.
- [x] Define a dual-field chat contract that preserves the filtered default while carrying original text for the
      explicitly disabled client filter, per D3.
- [ ] Add campaign-presentation and chat tests for both preference values, keyboard/pointer progression, history, moderation policy, and live changes.

Acceptance criteria:

- Disabling subtitles never removes required narrative text or blocks progression.
- Profanity policy is enforced at the authoritative boundary, and the UI accurately describes what its preference can change.

### Stage 6: match speed and visibility

- [x] Add a protocol enum and shared game-mode value for visibility; speed remains deliberately personal and single-player-only.
- [x] Add host-only lobby controls and carry resolved visibility through shared game-instance data used by reconnect,
      save, spectator, and replay flows.
- [x] Resolve visibility and initialize `FogOfWarComponent` from that value; campaign-authored overrides remain explicit.
- [x] Replace production speed choices with Slow/Normal/Fast single-player cadence and keep multiplayer at Normal.
- [ ] Add protocol, server, lobby, fog, simulation, save/reconnect, and replay compatibility tests.
- [ ] Run a two-client manual playtest for every multiplayer rule before enabling it outside development.

Acceptance criteria:

- All peers, spectators, reconnects, saves, and replays observe the same resolved match rules.
- Visibility never becomes a local cheat switch.
- Multiplayer speed cannot be changed by one client.

## Suggested follow-up issue split

Do not create these issues until D1–D7 are answered. Each row is independently reviewable;
later rows must consume the contracts created by their dependencies rather than duplicate them.

| Order | Suggested issue                                                      | Dependencies | Completion boundary                                                                                                 |
| ----- | -------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------- |
| 1     | Typed personal settings and WC3-like options controls                | D1           | Persisted defaults, legacy hydration, typed live changes, Angular tests; no runtime claim for deferred controls.    |
| 2     | Wire default and maximum camera distance                             | 1, D5        | Fresh/load/cinematic precedence, bounds clamping, handler tests, manual zoom smoke test.                            |
| 3     | Make replay autosave opt-in                                          | 1            | Default-off shutdown behavior, one archive when enabled, recorder tests.                                            |
| 4     | Add FPS, elapsed-time, and APM HUD metrics                           | 1, D4        | Scene-backed HUD, metric tests, lifecycle cleanup, playfield-safe layout.                                           |
| 5     | Add transport RTT measurement and ping HUD                           | 1, 4         | Typed RTT provider, unavailable/reconnect states, throttling, transport and HUD tests.                              |
| 6     | Separate optional subtitles from required campaign dialogue          | 1, D2        | Accessible progression/history in both modes and campaign presentation tests.                                       |
| 7     | Define configurable profanity filtering without weakening moderation | 1, D3        | Approved authority/transport contract, server and client tests, accurate UI copy.                                   |
| 8     | Add match-authoritative visibility modes                             | D7           | Protocol/server/lobby/fog/save/reconnect/replay wiring and two-client playtest.                                     |
| 9     | Unify single-player speed and design multiplayer match speed         | 1, D6        | Approved single-player defaults first; multiplayer only after shared cadence authority and two-client verification. |

## Decisions required

### D1: delivery sequence

- Recommendation: ship stages 1–4 first, with ping allowed to trail behind the other diagnostics; implement stages 5–6 only after their contracts are approved.
- Rationale: the first group is local and bounded, while moderation, accessibility, and match rules cross security or deterministic authority boundaries.
- Deferral impact: implementation should not begin because the settings schema and UI scope depend on this split.
- Reply: `Accept recommendation`, `Use: <sequence>`, or `Defer`.

### D2: subtitle meaning

- Recommendation: keep required campaign dialogue always visible and reserve “subtitles” for optional transcription of voiced audio once voice playback exists.
- Rationale: today’s subtitle panel is the dialogue itself and may require acknowledgement.
- Deferral impact: show the setting as disabled with explanatory text, or omit it until the distinction exists.
- Reply: `Accept recommendation`, `Use: hide all campaign dialogue`, or `Defer`.

### D3: profanity policy

- Recommendation: retain mandatory server sanitization for multiplayer chat and do not offer a misleading disable switch yet; add the default-on preference only with a moderation-approved transport/display design.
- Rationale: the server currently destroys the original text, and exposing it would change moderation guarantees.
- Deferral impact: profanity filtering remains always on.
- Reply: `Accept recommendation`, `Use: <policy>`, or `Defer`.

### D4: APM definition

- Recommendation: rolling 60-second local committed gameplay-command rate, excluding selection and presentation-only input.
- Rationale: it is stable across frame rates and observes accepted game actions rather than raw clicks.
- Deferral impact: the APM toggle cannot be implemented consistently.
- Reply: `Accept recommendation`, `Use: <definition>`, or `Defer`.

### D5: camera values

- Recommendation: expose the existing discrete zoom set, default 1x and farthest 0.5x, using player-facing “camera distance” labels rather than raw Phaser zoom values.
- Rationale: this preserves current rendering behavior and avoids introducing arbitrary zoom artifacts.
- Deferral impact: camera controls remain hard-coded.
- Reply: `Accept recommendation`, `Use: <default and maximum values>`, or `Defer`.

### D6: game speed scope

- Recommendation: persist a Normal single-player default now; treat multiplayer Slow/Normal/Fast as a later match-authoritative feature and remove development-only 10x/100x values from production-facing options.
- Rationale: current lockstep intentionally prevents a client from scaling multiplayer simulation.
- Deferral impact: existing single-player HUD speed controls remain unchanged and multiplayer stays Normal.
- Reply: `Accept recommendation`, `Use: <scope and values>`, or `Defer`.

### D7: visibility ownership

- Recommendation: expose visibility only to the host/map configuration, never in a player’s personal settings; map WC3-like choices to the existing fog modes as described above.
- Rationale: local visibility control would disclose hidden terrain/units and desynchronize player expectations.
- Deferral impact: current map/campaign fog policy remains authoritative.
- Reply: `Accept recommendation`, `Use: <mapping/owner>`, or `Defer`.

## Verification plan

Results (2026-08-15):

- [x] Focused Angular, Phaser, and NestJS tests pass (18 tests across six suites).
- [x] Lint passes for protocol, server, interface, Phaser, chat, and database-schema projects.
- [x] Protocol and server TypeScript checks pass; changed client/Phaser code has no new type errors.
- [x] Phaser Editor validation passes with 0 errors across 469 scenes and 563 prefab references.
- [x] Portal production compilation and bundle generation complete when dependency tasks are excluded.
- [ ] Standard production build remains blocked by 511 unhydrated Git LFS audio pointers; the generated bundle then
      hits the repository's existing 2 MB initial budget (4.12 MB). Neither condition is introduced by issue #734.
- [ ] Two-client manual visibility/ping/reconnect playtest requires a configured multiplayer runtime.

- Focused unit tests for each owning project and changed service/component.
- Type checking and lint for the probable-waffle interface, Phaser, protocol, and server projects touched by an approved stage.
- Production build when shared protocol or workspace configuration makes unrelated applications part of the affected graph.
- Browser/Tauri options smoke test: defaults, persistence after reload, live in-game changes, keyboard labels, narrow viewport, and modal return path.
- Phaser smoke test: camera bounds, diagnostics lifecycle, replay shutdown, campaign dialogue progression, and fog modes.
- Two-client test: host-selected match rules, latency display, pause/stall, reconnect, spectator, save/load, and replay playback.

## Out of scope

- Reproducing Warcraft III visual styling or assets.
- Allowing a local visibility override during a normal match.
- Enabling unsafe/unmoderated multiplayer chat.
- Applying client-selected speed to multiplayer lockstep.
- Treating the current campaign dialogue panel as optional captions.

## Continuation prompt

After recording answers to D1–D7, continue with:

> Implement issue #734 from `docs/ai/734-improve-game-options.md`. Treat the reviewed
> D1–D7 answers as authoritative. Start with the first approved stage, update tests with
> each behavior change, run the stage’s focused verification, and preserve multiplayer,
> replay, save/reconnect, moderation, and campaign-accessibility boundaries.
