# Spell audio and VFX implementation plan

Closes #647, #648, and #649.

## Approved direction

Make spells capable of playing typed cast/impact audio and registered impact VFX, but do not invent, substitute, or ship placeholder SFX. The project does not yet have approved spell sounds. Missing feedback is a supported no-op until assets are supplied.

## Current mismatch

- `SpellData.sounds` and `AoeZoneData.sounds` accept unconstrained strings, while working combat audio uses `SoundDefinition` audio-sprite pairs and `AudioService.playSpatialAudioSprite`.
- Spell definitions contain names such as `frost_cast` and `fire_ignite`, but those names are not loaded audio assets. Playing them would silently fail.
- Projectile spell definitions contain animation names such as `snowstorm_impact` and `frost_nova_impact` that are not registered effect animations.
- `SpellCastingSystem` already owns the correct cast and resolved-impact moments, but its #647/#648/#649 branches are TODOs.
- `AttackComponent` is the established reference for visibility-gated spatial sound and `EffectsAnims` impact sprites with depth/tint handling.

## Target contract

- Replace spell audio strings with optional typed `SoundDefinition` values (or arrays if variants are required), separated into `cast`, `impact`, and `loop` roles. Use the same contract in persistent AOE data instead of maintaining a second string-only representation.
- Keep every role optional. An absent role performs no lookup, warning, or playback.
- Require impact VFX to reference the registered `EffectsAnims` key type rather than an arbitrary string, retaining optional tint and variant selection.
- Definitions must omit feedback until a real registered asset exists. Remove the current fictional string references during migration; do not map them to unrelated weapon sounds.
- Validate configured audio-sprite key/name pairs and effect keys through the existing asset/registry validation path so future bad references fail in development/CI instead of at runtime.

## Runtime behavior

- Cast audio plays spatially from the caster only when the caster is visible to the local viewer.
- Impact audio and VFX originate at the resolved world impact position and are suppressed when that position is not visible. If the existing visibility API only accepts actors, add one reusable tile/world-position visibility helper rather than leaking map scans into `SpellCastingSystem`.
- Cosmetic variant selection may be non-deterministic, but it must never affect simulation state, damage timing, cooldowns, or command/replay data.
- Projectile cleanup, effect depth, tint, animation completion cleanup, scene shutdown, and looping-zone audio cleanup follow their existing owners.
- Instant spells need an explicit resolved-impact feedback call after successful target resolution; projectile spells call it when the projectile arrives. Effects must not play twice.

## Staged implementation

1. **Shared contract PR:** migrate `SpellData`, projectile effect keys, `AoeZoneData`, and all spell definitions to typed optional feedback. Delete fictional references, add registry validation tests, and leave audio roles empty until SFX arrives.
2. **#647 cast-audio PR:** implement the visibility-gated typed cast hook in `SpellCastingSystem`, including configured and missing-feedback tests.
3. **#648 impact-VFX PR:** implement one shared resolved-impact VFX helper using registered `EffectsAnims`, depth/tint, completion cleanup, projectile and instant-cast coverage. Populate only mappings for approved, semantically matching effects that already exist; otherwise leave the definition empty.
4. **#649 impact-audio PR:** implement the visibility-gated typed impact hook at the resolved position, including configured, fogged, and missing-feedback tests.
5. **Persistent-zone follow-up:** migrate loop playback and cleanup through the same typed contract. Keep it separate if it broadens the three issues beyond their acceptance criteria.

## Acceptance criteria

- No spell definition references an unloaded audio key/name or unregistered effect animation.
- Adding an approved `SoundDefinition` to a spell is sufficient to enable playback; no system code change is needed.
- Spells without SFX remain silent without errors or warnings.
- Configured cast and impact feedback obey local fog-of-war visibility.
- Instant and projectile impacts trigger feedback exactly once at the resolved location.
- All feedback remains cosmetic and does not change deterministic simulation or replay state.
- Effect sprites and looping audio are cleaned up on completion and scene shutdown.

## Verification

- Type-check gameplay, protocol, and Phaser consumers after the contract migration.
- Test typed configured/missing audio, invalid registry references, visible/fogged playback, instant/projectile single-trigger behavior, and cleanup.
- Run focused Phaser tests, lint, Phaser Editor/asset validation, and deterministic replay checks.
- Manual test with a temporary test-only registered sound/effect fixture; do not commit placeholder media.

## Deferred asset work

When real SFX arrive, add them through the audio-sprite pipeline, register them, then assign their typed definitions per spell. That asset PR should document source/license, loudness normalization, loop boundaries where applicable, and manual spatial/fog checks.

## Continuation prompt

```text
Implement the shared contract stage from docs/ai/647-649-spell-feedback-contracts.md. Typed optional spell feedback is approved, but there are no approved spell SFX: remove fictional string references and leave audio roles unset. Add registry validation and missing-feedback tests, preserve deterministic simulation, and open a separate draft PR. After it merges, implement #647, #648, and #649 as separate draft PRs without adding placeholder media.
```
