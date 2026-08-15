# Seagull water prefab plan

Tracks [#628](https://github.com/JernejHabjan/fuzzy-waddle/issues/628). Related dependency:
[#575](https://github.com/JernejHabjan/fuzzy-waddle/issues/575).

## Status

- [x] Inspect #628, related issue #575, and the current repository implementation.
- [x] Trace the reused Little Muncher bird frames, animations, `TreeBird` prefab, asset pack, actor index, and shark contracts.
- [x] Classify the work and record the material product and architecture decisions.
- [ ] Receive reviewer answers for D1-D6.
- [ ] Implement the approved asset, prefab, trigger, tests, and map placement.
- [ ] Complete automated verification and the manual playtest matrix.

## Classification and scope

- **Lane:** `decision-pr`; this PR records the implementation path and does not change runtime behavior.
- **Goal:** add a scene-backed ambient seagull that idles on water and permanently flies away when a nearby shark approaches.
- **Dependency:** #575 must first expose a typed, indexed shark actor. It currently records completed shark-fin and foam assets, but this repository has no shark prefab, actor definition, or `ObjectNames.Shark` entry.
- **Out of scope:** implementing shark movement/combat/hooking, changing `TreeBird`, synchronizing ambient animation state, or adding general spatial-query infrastructure.

## Current boundary

Probable Waffle already imports the ten Little Muncher bird frames into the `animals` atlas and defines `bird-idle`, `bird-idle-flap`, `bird-fly-off`, and `bird-fly` animations. `TreeBird` uses those animations, alternates idle poses on a five-second wall-clock timer, reacts to pointer input, flies on a random yoyo tween, and returns to idle. It owns cleanup of its timer, tween, and pointer listener.

`TreeBird` is embedded in three tree prefabs, so changing its lifecycle would alter existing land ambience. The water seagull should be a sibling prefab that reuses the proven animation sequencing and asset pipeline without inheriting the click-triggered, return-to-perch behavior.

`ActorIndexSystem` is the existing authority for registered runtime actors, but there is no shark actor type to query. The seagull is ambient presentation rather than a gameplay actor: it should not receive an ID, owner, health, save/snapshot state, selection behavior, or multiplayer commands.

## Material decisions

### D1 — Shark dependency and identity

- **Recommendation:** require #575 to add a runtime shark prefab registered under a typed `ObjectNames.Shark` contract, then identify threats through `ActorIndexSystem` and exact actor type. Do not infer sharks from texture keys, constructor names, arbitrary tags, or substring matching.
- **Rationale:** the actor index is already the lifecycle-safe registry for moving actors, while a shared enum prevents the seagull and shark implementations from drifting.
- **Impact of deferral:** the seagull can be authored visually, but #628 cannot satisfy its proximity acceptance criterion or ship as complete.
- **Reply:** `Accept recommendation`, `Use: <alternative shark contract>`, or `Defer`.

### D2 — Seagull artwork

- **Recommendation:** create a human-authored paint-over of the existing ten Little Muncher bird source frames, preserving frame dimensions, silhouettes, and animation timing while giving the bird a readable white/grey seagull palette and water-sitting idle. Add the source frames to metadata, update the TexturePacker project, and regenerate the atlas and animation JSON. Confirm the existing bird asset provenance before publishing the derivative; do not use generative-AI assets.
- **Rationale:** this visibly meets “reworked into a seagull” while retaining the already-integrated animation structure and avoiding runtime tint limitations.
- **Impact of deferral:** implementation can only reuse the existing brown tree bird and would not meet the visual acceptance criterion.
- **Reply:** `Accept recommendation`, `Use: runtime tint`, `Use: separately supplied licensed frames`, or `Defer`.

### D3 — Ambient versus synchronized state

- **Recommendation:** keep the seagull client-local and non-authoritative. Use wall-clock polling/tweens for presentation, read the synchronized shark positions, and never include seagull state in lockstep, snapshots, saves, or reconnect restoration.
- **Rationale:** #628 describes environment flavor, and existing ambient prefabs already use wall-clock timers. Synchronizing a decorative one-shot would add networking and persistence scope without gameplay value.
- **Impact of deferral:** implementation cannot choose timer ownership, multiplayer behavior, or test boundaries safely.
- **Reply:** `Accept recommendation`, `Use: synchronized actor`, or `Defer`.

### D4 — Trigger tuning

- **Recommendation:** expose `reactionRadius` as a Phaser Editor prefab field with a default of 192 world pixels and poll the actor index every 250 ms while idle. Trigger once when any active `ObjectNames.Shark` is within Euclidean world-space distance; ignore destroyed or inactive actors.
- **Rationale:** the defaults give a tunable three-tile-width warning zone without a per-frame scene scan. Editor exposure allows map-specific adjustment without hardcoded variants.
- **Impact of deferral:** the feature lacks an acceptance-testable definition of “near” and risks either invisible late reactions or excessive polling.
- **Reply:** `Accept recommendation`, `Use: <radius and cadence>`, or `Defer`.

### D5 — Takeoff path and lifetime

- **Recommendation:** make takeoff one-shot. Play the takeoff animation, transition to the looping flight animation, fly horizontally away from the triggering shark with a consistent upward screen-space lift, and destroy the seagull after it exits a padded camera/world bound or reaches a short safety timeout. Do not return to the water during the current scene session.
- **Rationale:** moving away from the threat makes the reaction legible, while destruction provides a clear terminal state and avoids off-screen timers/tweens.
- **Impact of deferral:** the current `TreeBird` yoyo behavior would bring the seagull back beside the shark and contradict “flies away.”
- **Reply:** `Accept recommendation`, `Use: return after <duration>`, `Use: fixed flight direction`, or `Defer`.

### D6 — Water placement and sound

- **Recommendation:** treat water placement as a Phaser Editor/map-author responsibility and keep the prefab non-colliding. Add no per-seagull sound in #628; maps may reuse the existing attributed `seagulls` ambient `SoundEffectMarker` where desired.
- **Rationale:** runtime terrain validation would couple a decorative sprite to tilemap/navigation services, while the existing ambient sound system already avoids repeated overlapping calls.
- **Impact of deferral:** implementation cannot finalize prefab fields or decide whether new audio/licensing work belongs in scope.
- **Reply:** `Accept recommendation`, `Use: runtime water validation`, `Use: per-takeoff sound`, or `Defer`.

## Implementation stages

### Stage 1 — Typed shark prerequisite

- [ ] Complete or consume #575's `ObjectNames.Shark`, shark prefab/definition, actor registration, and active lifecycle contract.
- [ ] Add the shark to the owning definition/creation registries and verify it appears in `ActorIndexSystem.getAllIdActors()`.
- [ ] Keep shark movement, combat, ship hooking, foam behavior, and balance owned by #575 rather than #628.

Acceptance criteria:

- #628 can identify a shark through a shared typed contract without inspecting visuals or implementation class names.
- Destroyed sharks are removed from the actor index through the existing actor lifecycle.

### Stage 2 — Seagull asset and scene-backed prefab

- [ ] Produce and provenance-check the approved seagull source frames.
- [ ] Add distinct seagull atlas frames and animation keys through the existing `animals.tps`, generated atlas, animation JSON, and asset pack.
- [ ] Create paired `WaterSeagull.scene` and `WaterSeagull.ts` files under a focused ambient/water animal directory.
- [ ] Implement explicit `idle`, `taking-off`, `flying`, and terminal lifecycle states; keep `TreeBird` unchanged.
- [ ] Document timer, tween, listener, destruction, and non-authoritative ownership, and keep Phaser Editor/generated-code boundaries synchronized.

Acceptance criteria:

- A map author can place the prefab over water and see a recognizable seagull idle animation.
- The prefab has no actor ID, selection, collision, combat, persistence, or lockstep responsibilities.
- Repeated construction/destruction leaves no timer, tween, animation listener, or scene listener behind.

### Stage 3 — Shark proximity reaction

- [ ] Resolve `ActorIndexSystem` through the typed scene-service helper and poll only while the seagull is idle.
- [ ] Filter indexed actors by the approved shark type and active lifecycle before measuring distance.
- [ ] Pass the triggering shark position into a guarded one-shot transition so simultaneous sharks cannot start duplicate takeoffs.
- [ ] Stop polling at takeoff, fly away according to D5, maintain depth while moving, and destroy cleanly at the terminal bound/timeout.
- [ ] Fail safely in isolated prefab-preview/test scenes that do not install `ActorIndexSystem`.

Acceptance criteria:

- Non-shark actors and sharks outside the radius do not trigger takeoff.
- The first nearby active shark triggers exactly one takeoff away from that shark.
- No polling or movement work remains after takeoff completion, destruction, or scene shutdown.

### Stage 4 — Tests, map integration, and closure

- [ ] Add focused Phaser tests for idle behavior, type/radius filtering, single transition, direction selection, missing-service behavior, and cleanup.
- [ ] Add the prefab to one representative water map in both `.scene` and generated TypeScript, or provide an isolated prefab-preview scene if the target map is not yet approved.
- [ ] Complete omission and closure audits across asset metadata, generated files, animation keys, imports, scene pairing, comments/docs, registrations, and tests.
- [ ] Capture idle and post-trigger screenshots or a short clip in the implementation PR.

Acceptance criteria:

- Automated tests discover and execute the focused cases.
- Visual evidence shows the water idle and shark-triggered fly-away states.
- The representative map and Phaser Editor source remain structurally synchronized.

## Verification plan

Run serialized in the worktree with `NX_DAEMON=false` after implementation:

- `pnpm exec nx test probable-waffle-phaser --runInBand`
- `pnpm exec nx lint probable-waffle-phaser`

Manual playtest matrix:

- Place the seagull on water with no shark, a non-shark actor, and a shark outside the configured radius; confirm it remains idle.
- Move one shark across the radius in each approach direction; confirm one takeoff away from the shark and terminal cleanup.
- Approach with multiple sharks simultaneously; confirm no duplicate animation callbacks, tweens, or destruction.
- Destroy the seagull, destroy the shark, and leave/restart the scene during idle, takeoff, and flight; confirm clean lifecycle behavior.
- Run single-player and multiplayer clients; confirm the reaction never creates a command, snapshot entry, save record, selection target, or desync.
- Preview the paired prefab in Phaser Editor and load the representative map; confirm atlas frames, origin/depth, water placement, and generated TypeScript match.

## Risks and guardrails

- #575 is a real dependency, not an invitation to implement shark gameplay in this PR.
- Preserve `TreeBird` behavior for its three existing tree-prefab consumers.
- Keep all newly authored bitmap inputs and their provenance in metadata; do not hand-edit only generated atlas output.
- A local ambient reaction may differ by a few milliseconds across clients. It must never affect simulation, collision, visibility, audio authority, or persistence.
- The actor-index scan is acceptable at the proposed cadence for a few placed seagulls; if maps need large flocks, introduce a separately measured spatial-query improvement rather than broadening #628 speculatively.

## Continuation prompt

```text
Continue issue #628 from docs/ai/628-seagull-water-prefab.md after recording reviewer answers for D1-D6 as authoritative. Confirm the typed shark contract from #575 exists before implementing Stage 3. Implement the stages in order, keep WaterSeagull.scene and WaterSeagull.ts synchronized, preserve TreeBird behavior, use only provenance-verified human-authored assets, keep the seagull client-local and non-authoritative unless explicitly decided otherwise, run the listed checks with NX_DAEMON=false, complete the omission and final closure audits, and update the draft PR with visual/manual-playtest evidence. Do not merge.
```
