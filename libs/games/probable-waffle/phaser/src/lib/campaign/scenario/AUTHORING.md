# Campaign scenario authoring

Campaign missions keep story logic in mission JSON while maps keep spatial layout in Phaser Editor and terrain in Tiled. Do not replace the generated map loader or copy coordinates into mission JSON.

## Stable IDs

- Use lowercase kebab-case IDs that describe the story role, such as `camp-hero`, `north-gate`, or `evacuation-route`.
- IDs share one namespace per map across actors, points, regions, routes, groups, camera shots, and spawn sets.
- Never reference a Phaser Editor object UUID, generated variable name, or display label. Those may change without changing the stable scenario ID.
- Add `EditorScenarioReference` to an existing actor prefab instance and set `scenarioId`. Use comma-separated `tags` only for intentional group membership.
- Use the scenario marker prefabs in `prefabs/scenario` for points, regions, routes, groups, camera shots, and spawn sets. Keep each `.scene` file paired with its generated `.ts` file.

## Marker fields

- Points store a logical `x`, `y`, and `z` location.
- Rectangular regions use the visible editor rectangle. Their left/top edges are inclusive; right/bottom edges are exclusive.
- Polygon regions use semicolon-separated local `x,y` pairs, for example `0,0;128,0;64,96`. Polygon edges are inclusive.
- Region elevation is `any`, one `same-level`, or an inclusive `range`.
- Routes and spawn sets contain comma-separated point IDs. Route facing angles are empty or contain exactly one number per point.
- Groups contain explicit actor-role IDs, required tags, or both.
- Camera shots contain their logical center, positive zoom, non-negative integer duration in simulation ticks, and optional letterboxing.

## Runtime behavior

The scene registry compiles static markers once after generated editor objects exist and before mission phase entry. Actors are registered after initialization, can claim a role at runtime, and are removed from indices when destroyed. Actor roles and tags are saved with actor state and do not change when ownership changes. Static point and region geometry is reloaded from the map rather than duplicated in saves.

Debug overlays should read `debugGeometry()` and developer-camera tools should use `debugFocus()` only in local development tooling. Mission runtime logic must use registry queries and logical transforms so camera movement, render offsets, and frame rate cannot affect results.

## Trusted hooks

Use declarative actions first. A `trusted-hook` is allowed only when its stable hook ID is registered in both the content registry and `CampaignTrustedHookRegistry`. Its content registration must document determinism, continuation serialization, cleanup ownership, and a focused test ID. An executor that can wait must serialize all continuation data and implement cancellation; it may not read wall-clock time, generate unsynchronized IDs, or mutate presentation as gameplay state. Missing registrations fail validation or mission execution instead of falling through to arbitrary code.

## Validation workflow

After editing a scenario map:

1. Regenerate the Phaser Editor TypeScript for changed scenes, prefabs, and user components.
2. Run `npx nx test probable-waffle-campaign --runInBand` to validate mission JSON and map-reference diagnostics.

## Developer diagnostics and mission harness

- Press F9 in a development campaign scene to inspect flow, state, objectives, encounters, presentation, save state, integrity, and the bounded trace. Opening or focusing from the panel is read-only and does not affect rewards.
- Mutating commands must go through `CampaignDiagnosticsService.execute`; production rejects them and development invalidates reward integrity before execution. Facts and counters must opt in with `debugMutable`.
- Use `CampaignMissionTestHarness` for rendering-free fixed-tick smoke paths. Advance explicit ticks/events, call `roundTrip()` at authored checkpoints, and compare `serialized()` output for deterministic continuation.
- Keep map focus/highlight local. Mission conditions/actions must continue to query stable scenario references rather than debug geometry.

3. Run `npx nx test probable-waffle-phaser --runInBand` to validate prefab/component pairs, both campaign maps, stable-ID extraction, region boundaries, and actor-role persistence.
4. Run `npx nx lint probable-waffle-phaser` and the affected portal build.

Missing and duplicate IDs report the mission source path, JSON path, scene key, reference kind, and stable ID. Fix the authored stable ID or mission reference; do not work around validation with an editor UUID.
