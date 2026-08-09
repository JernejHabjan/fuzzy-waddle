# Spell feedback contract decision

Closes #647, #648, and #649.

## Why a contract decision comes first

`SpellCastingSystem` has explicit TODOs for cast audio, projectile-impact animation, and impact audio. The authored spell data currently references string sound and animation names that are not registered assets. Existing combat feedback instead uses typed audio-sprite `SoundDefinition` values and registered `EffectsAnims` keys.

Calling the existing playback helpers with the current string values would silently fail or create effects with no registered animation.

## Decision required

1. **Accept recommendation — reuse registered feedback.** Migrate spell definitions to the existing typed audio-sprite sound definitions and registered `EffectsAnims` values. Use visibility-gated spatial playback at the caster for cast audio and resolved target for impact audio/VFX.
2. **Use: <new assets/mappings>.** Attach or name approved sound/animation assets for each spell; implementation will register them through the existing asset pipeline.
3. **Defer.** Preserve the TODOs and avoid silent no-op playback.

The recommendation enables three small implementation PRs after one shared mapping update, avoids unlicensed/new assets, and follows the working weapon-impact behavior.

## Staged implementation after approval

1. Add the approved typed mappings to spell data, with missing-feedback safety.
2. **#647:** play configured cast audio at spell start.
3. **#648:** spawn configured impact VFX at the resolved world target with existing depth/tint cleanup.
4. **#649:** play configured impact audio at the resolved target.
5. Add focused tests for the mapping and event helpers, then manually test visible, fogged, and missing-feedback cases.

## Continuation prompt

```text
Continue the spell feedback plan for #647, #648, and #649. The approved feedback source is: <paste reviewer response>. First implement only the shared typed mapping/registration stage, validate every referenced asset, and open separate PRs for cast audio, impact VFX, and impact audio. Preserve fog-of-war visibility gating and do not use unregistered string asset IDs.
```
