# #723 Campaign narrator tutorial improvement plan

## Status

- Delivery lane: `decision-pr`
- Current stage: D1-D5 approved; plan is implementation-ready and implementation has not started
- Issue: [#723 — Improve narrator tutorials](https://github.com/JernejHabjan/fuzzy-waddle/issues/723)
- Reference behavior: explicit narrator guidance for selection, movement, attack-move, direct attacks, and mixed-selection subgroups.

## Scope

Improve the playable Dreams prologue so a new player is explicitly taught the unit-control flow already used by Probable Waffle. Keep the instruction inside the campaign dialogue/objective presentation boundary, preserve deterministic mission authority, and avoid copying artwork or presentation assets from the reference screenshots.

Approved teaching sequence:

1. Select the Tivara formation and move it toward the highlighted battle area.
2. After the faction handoff, select the Skaduwee formation and issue an attack-move toward the battle area.
3. Explain that right-clicking an enemy issues a direct attack.
4. When a mixed selection is present, explain how `Tab` and unit portraits choose which subgroup supplies the command card.
5. Repeat concise narrator reminders while the relevant tutorial objective remains active.

## Current boundary

- `dreams/mission.json` already owns two tutorial objectives, one for each controlled faction. Both complete when the relevant captain enters `battle-region`.
- Both objectives currently expose the same `command.attack` prompt even though the Tivara description permits either move or attack and the Skaduwee description does not explicitly teach attack-move.
- The reveal lines are spoken by the faction captains. Narrator reminders exist, but they say only to command the captain toward battle and do not name the controls.
- `MissionSemanticInputAction` and `CampaignInputPromptRegistry` distinguish selection, move, and attack, with keyboard/mouse and touch copy. The current attack prompt describes right-clicking an enemy; it does not represent attack-move onto ground.
- `SelectionTabHandler` groups mixed selections by actor type and cycles the active group with `Tab`. `ActorActions` and `ActorInfoContainer` follow that active group when choosing the command card and highlight.
- Clicking a portrait in `ActorInfoLabels` currently sends a new single-actor selection. It does not activate that actor's subgroup while preserving the mixed selection, unlike the supplied reference behavior.
- Mission progress currently observes world outcomes such as region occupancy. The campaign event adapter does not emit selection, order, or subgroup input events, and `CampaignObjectiveProjectionStore.markPromptSeen` has no caller.

## Approved experience

- Use the Dreams prologue rather than adding a second tutorial mission. It already controls both factions, owns the first semantic command objectives, and contains mixed formations.
- Make the narrator the instructional voice. Captain lines may retain story flavor, but every required control should appear in narrator dialogue and in the matching objective prompt.
- Teach the fastest default and the visible command-card alternative: right-click ground or `M`/Move then left-click ground for movement; `A`/Attack then left-click ground for attack-move; right-click an enemy for a direct attack.
- Keep tutorial progress forgiving: arriving at the authored destination completes the step even if the player used another valid command. Use prompt-seen state only to shorten repeated guidance, never as mission authority.
- Teach subgroup switching only when the selected formation contains more than one actor type. Do not display a dead `Tab` instruction for a homogeneous selection.

## Approved decisions

### D1 — Tutorial placement and order (approved)

- Decision: teach selection and movement during the Tivara rally, then teach attack-move, direct attack, and mixed-selection subgroups during the Skaduwee rally after the existing faction handoff.
- Rationale: this gives each controlled faction one focused lesson and avoids inserting a separate tutorial mission or delaying the story opening.

### D2 — Control wording (approved)

- Decision: narrator and objective prompts name both the shortcut/command-card path and the direct RTS shortcut: Move/`M` plus ground click or right-click ground; Attack/`A` plus ground click for attack-move; right-click enemy for direct attack. Touch copy remains mode-specific and omits keyboard terms.
- Rationale: the wording matches the implemented Move and Attack actions while preserving the discoverable command card shown in the references.

### D3 — Portrait subgroup behavior (approved)

- Decision: in a mixed selection, an unmodified click on a non-active unit portrait activates that actor-type subgroup without replacing the full selection; `Tab` cycles the same groups. Preserve modifier-assisted selection editing and single-selection behavior.
- Rationale: this makes the supplied subgroup instruction true, aligns portrait highlight with the active command card, and extends the existing `SelectionTabHandler` authority instead of introducing parallel state.

### D4 — Completion strictness (approved)

- Decision: retain outcome-based completion through `battle-region`; do not block mission progress on exact selection or order input. Mark observed semantic inputs as seen only to collapse prompts and suppress redundant reminders.
- Rationale: the tutorial remains accessible and save-safe, while the deterministic mission runtime does not need local input events as authoritative conditions.

### D5 — Replay and reminders (approved)

- Decision: show the full tutorial on every Dreams run, collapse each prompt after the corresponding action during that run, and retain the existing 20-second narrator reminder cadence while its objective is active.
- Rationale: Dreams remains a dependable tutorial entry point without adding profile-level tutorial preferences or persistence.

## Implementation stages

### Stage 1 — Semantic tutorial prompt contract

- [ ] Split the ambiguous attack prompt into explicit attack-move and direct-attack semantic actions; add subgroup-next and subgroup-portrait actions.
- [ ] Update the TypeScript contract, mission JSON schema, default keyboard/mouse and touch registrations, and exhaustive registration tests together.
- [ ] Route observed move, attack-move, direct-attack, and subgroup changes to local prompt-seen presentation state without making them campaign-runtime completion conditions.
- [ ] Document that seen state is local presentation state and is intentionally reset for a new mission run.

Acceptance criteria:

- Every narrated action resolves to accurate mode-specific prompt text.
- Attack-move and direct attack are no longer represented by one misleading semantic action.
- Observing an action may collapse its prompt but cannot change deterministic mission progress, saves, replays, or multiplayer authority.

### Stage 2 — Mixed-selection subgroup interaction

- [ ] Extend `SelectionTabHandler` with one typed activation path shared by `Tab` and portrait clicks.
- [ ] In `ActorInfoLabels`, map a clicked mixed-selection portrait to its actor-type group while preserving the full selection; retain current modifier and single-selection semantics.
- [ ] Keep `ActorInfoContainer`, `ActorActions`, portrait highlights, and primary-actor resolution synchronized with the active subgroup.
- [ ] Add focused tests for Tab cycling, portrait activation, homogeneous selections, selection replacement, modifiers, selection changes, and shutdown cleanup.

Acceptance criteria:

- Tab and approved portrait input select the same active subgroup and command card.
- Switching subgroups does not silently drop actors from a mixed selection.
- Existing individual selection editing and scene-listener cleanup remain correct.

### Stage 3 — Dreams narrator and objective authoring

- [ ] Rewrite the relevant Dreams tutorial text and lines so narrator dialogue explicitly teaches the approved selection, move, attack-move, direct-attack, and subgroup flow.
- [ ] Give the Tivara and Skaduwee objectives distinct semantic prompts and concise reminder lines.
- [ ] Keep the existing faction handoff, battle-region completion, checkpoints, cinematics, and story outcome intact.
- [ ] Bump the mission revision and add the matching revision migration if objective/checklist or phase state changes.
- [ ] Update authored mechanics/tests metadata and focused Dreams catalogue tests for line speakers, prompt actions, reminder cadence, revision migration, and unchanged deterministic completion.

Acceptance criteria:

- A first-time keyboard/mouse or touch player can follow only the narrator and objective surface to complete both rally stages.
- Narrator copy matches actual game behavior and never conflates attack-move with direct attack.
- Watched/skipped cinematics, checkpoint round trips, replay rewards, difficulty variants, and mission victory remain equivalent to the current mission.

### Stage 4 — Verification and playtest

- [ ] Run the focused campaign and Phaser test/lint targets with `NX_DAEMON=false`.
- [ ] Play Dreams with keyboard/mouse and touch-mode prompts, including delayed reminders and both accepted subgroup inputs.
- [ ] Verify long/wrapped tutorial text at desktop and narrow HUD sizes without covering command controls or the objective tracker.
- [ ] Verify save/checkpoint restoration, replay, cinematic skip, faction handoff, mixed/homogeneous selections, and scene shutdown.
- [ ] Complete omission and final closure audits, then update the implementation PR with screenshots and playtest evidence.

Acceptance criteria:

- Automated checks discover and pass the intended tests.
- Manual evidence covers every approved control path and confirms that tutorial presentation cannot issue orders or mutate mission authority.
- No stale `command.attack` authoring, misleading copy, unused semantic action, duplicate listener, or temporary implementation remains.

## Verification plan

Run serialized in the worktree with `NX_DAEMON=false`:

- `pnpm exec nx test probable-waffle-campaign`
- `pnpm exec nx test probable-waffle-phaser`
- `pnpm exec nx lint probable-waffle-campaign`
- `pnpm exec nx lint probable-waffle-phaser`

Manual playtest matrix:

- Tivara rally: select the formation, move via right-click, then repeat with Move/`M`; verify narrator copy, destination completion, and reminder cancellation.
- Skaduwee rally: attack-move via Attack/`A` plus ground click; direct-attack an enemy by right-click; verify distinct guidance and forgiving destination completion.
- Mixed selection: cycle every subgroup with `Tab`; activate each type through portraits and verify selection preservation, highlight, and command-card changes.
- Homogeneous and single selection: no unusable subgroup prompt; portrait and command behavior remain unchanged.
- Touch prompt mode: no keyboard-only language and accurate button/tap instructions.
- Checkpoint/replay: restore before each rally, skip/watch cinematics, and complete on every difficulty without duplicated tutorial lines or changed rewards.
- HUD/lifecycle: desktop and narrow wrapping, repeated delayed reminders, faction handoff cleanup, and scene shutdown without stale subscriptions.

## Risks and guardrails

- Tutorial text is executable UX documentation: do not describe a control until its runtime behavior and input mode are verified.
- `command.attack` currently conflates attack-move and direct attack. Keep the semantic contract exhaustive so future authoring cannot silently pick the wrong prompt.
- Local prompt-seen state must not become lockstep, save, replay, or multiplayer mission authority.
- Activating a subgroup and replacing the full selection are different operations. Keep modifier behavior explicit and test both paths.
- Preserve the existing paired Phaser `.scene` files; this plan does not require layout changes, but any later HUD structural edit must keep scene and TypeScript output synchronized.
- The supplied Warcraft screenshots are behavior and composition references only. Do not copy their UI artwork, fonts, icons, audio, or other assets.

## Out of scope

- A separate tutorial campaign, campaign-wide onboarding redesign, tutorial-skip profile preference, or global remappable-input framework.
- New voice acting, bitmap UI assets, sound effects, cursor art, command-card redesign, or Warcraft asset reuse.
- Changing unit orders, combat behavior, AI, faction balance, mission rewards, checkpoints, multiplayer authority, or save/replay semantics.
- Strictly requiring exact input sequences; D4 keeps campaign completion outcome-based.

## Continuation prompt

```text
Implement issue #723 from docs/ai/723-improve-narrator-tutorials.md. D1-D5 are approved and authoritative; do not revisit them without a new explicit product decision. Start with Stage 1, keep the plan checklist current, preserve deterministic mission authority and paired Phaser .scene files, run the listed checks with NX_DAEMON=false, complete the manual playtest plus omission and closure audits, and update the draft PR with verification evidence. Do not merge.
```
