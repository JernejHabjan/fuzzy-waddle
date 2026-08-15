# #724 Campaign quest log improvement plan

## Status

- [x] Inspect issue #724, its reference image, labels, and existing pull requests.
- [x] Trace the objective projection, mission/chapter metadata, campaign HUD integration, paired Phaser scene, input suppression, and focused tests.
- [x] Separate presentation state from authoritative mission state and record the unresolved product decisions.
- [ ] Receive decisions D1-D5.
- [ ] Implement the approved projection and quest-log view model.
- [ ] Implement the scene-backed layout, interactions, and responsive behavior.
- [ ] Complete automated verification and the manual playtest matrix.

## Classification

This is a `decision-pr`. The issue contains a Warcraft-style reference image but no written acceptance criteria, and the current contracts leave material choices open around hidden-objective spoilers, category mapping, modal input behavior, and artwork. Implementation should begin after D1-D5 are reviewed.

## Current boundary

`CampaignObjectivesHud` owns both the compact tracker and a scene-backed mission-log overlay. The tracker is interactive, but the overlay currently renders the whole `CampaignObjectiveProjection` as one text block. It has no selectable rows, selected-objective details, independent columns, scrolling, or chapter/mission heading.

`buildCampaignObjectiveProjection` is the presentation authority for objective title, description, status, checklist progress, input prompts, focus targets, grouped quest-log entries, and history. It intentionally removes hidden objectives and their history so unrevealed text cannot leak. Chapter order/title and mission title already exist in the campaign catalogue, while runtime launch context carries stable campaign, chapter, and mission identifiers. No objective-icon contract exists.

The implementation must remain presentation-only: it must not mutate mission progress, persistence, replay data, or lockstep state. Selection and scroll position belong to the local Phaser view; objective status continues to come from the projection store.

## Recommended experience

- Replace the single text block with a full-viewport, dimmed quest-log overlay inspired by the reference composition: chapter/mission heading, main and optional lists, a selected-objective detail area, and a prominent `Done` action.
- Keep the compact tracker unchanged except for delegating opening/closing and selection to the quest-log surface.
- Render each discovered objective as a selectable row with a category/status glyph, title, status treatment, and selected state. Render the selected objective's checklist, progress, input hints, description, and optional focus action in the detail area.
- Preserve the selected objective across projection updates while it remains available. Otherwise select the first active main objective, then the first active optional objective, then the first remaining discovered objective.
- Use original Phaser-authored frames, shapes, typography, and existing licensed project assets. The issue screenshot is composition reference only; do not copy its artwork, borders, icons, or textures.

## Decisions requested

### D1 — Layout scope

- Recommendation: implement the full-viewport two-list/detail composition above, with main quests on the left and optional quests on the right; stack the lists above details at narrow viewports.
- Deferral impact: scene hierarchy, row sizing, scrolling, and responsive acceptance criteria cannot be finalized.
- Reply: `Accept D1`, `Use D1: <alternative>`, or `Defer D1`.

### D2 — Objective category mapping

- Recommendation: show `primary` and `secondary` under `Main quests`; show `optional` and revealed `hidden` kinds under `Optional quests`; and show `tutorial` in a compact `Guidance` subsection. Show `failure` objectives only after reveal, in the main column with a failure treatment. Keep mission-message history in the existing dialogue/history surface rather than mixing it into the quest list.
- Deferral impact: projection sections, ordering, headings, and empty states remain ambiguous.
- Reply: `Accept D2`, `Use D2: <mapping>`, or `Defer D2`.

### D3 — Undiscovered objectives

- Recommendation: show one inert `Undiscovered quest` placeholder for each objective whose runtime status is `hidden`, in the section selected from its authored kind, exposing only the count and category. Never expose its id, title, description, checklist, focus target, history, or status reason. Replace the placeholder in place when the objective is revealed.
- Lower-spoiler alternative: show no row or count until reveal, preserving current behavior.
- Deferral impact: the presentation projection cannot define its hidden-entry contract or regression tests.
- Reply: `Accept D3`, `Use D3: hide all placeholders`, or `Defer D3`.

### D4 — Modal and input behavior

- Recommendation: keep simulation running in every game mode, but treat the open quest log as a local blocking overlay. Consume pointer/wheel input over the overlay, suppress world selection/orders/cursors while open, and close with `Done`, `Escape`, or a click on the dimmed backdrop. Reuse the existing `Mission log` entry point; defer a global hotkey until there is a central remappable input contract.
- Rationale: a locally opened information panel must not request a synchronized multiplayer pause or affect deterministic state.
- Deferral impact: input arbitration, pause semantics, and manual multiplayer coverage remain unsettled.
- Reply: `Accept D4`, `Use D4: <alternative>`, or `Defer D4`.

### D5 — Icons and artwork

- Recommendation: ship original code/scene-authored frames and status/category glyphs using existing licensed fonts and UI assets. Do not add per-objective art metadata in this issue; reserve an icon slot so a separately licensed asset pass can add authored icons later without restructuring rows.
- Deferral impact: asset scope and whether the campaign content schema must change cannot be finalized.
- Reply: `Accept D5`, `Use D5: <approved asset/metadata policy>`, or `Defer D5`.

## Implementation stages

### Stage 1 — Quest-log projection contract

- [ ] Replace the raw grouped-record assumption with documented, ordered quest-log sections and entries that distinguish discovered objectives from undiscovered placeholders without exposing hidden content.
- [ ] Keep tracker behavior and history filtering unchanged.
- [ ] Add a small presentation context for chapter order/title and mission title, resolved from the campaign catalogue through the current mission director instead of duplicating strings in Phaser.
- [ ] Define deterministic ordering within sections: authored definition order first, with status styling handled by the view rather than reordering during updates.
- [ ] Add campaign projection tests for category mapping, hidden redaction, placeholder replacement, descriptions, checklist progress, and unchanged history privacy.

Acceptance criteria:

- The UI receives all approved headings, sections, statuses, and detail content from typed presentation contracts.
- Hidden objective text and identifiers never cross the projection boundary.
- Tracker, save/load, replay, and mission-runtime authority remain unchanged.

### Stage 2 — Scene-backed quest-log composition

- [ ] Extract the overlay into a focused scene-backed campaign quest-log prefab while leaving the compact tracker in `CampaignObjectivesHud`.
- [ ] Author synchronized `.scene` and TypeScript structures for the dimmer, frame, headings, list viewports, detail panel, and `Done` control.
- [ ] Render reusable objective-row views with selected, active, completed, failed, expired, and undiscovered treatments.
- [ ] Render the selected objective title, status, description, checklist/progress/input prompts, and focus action without flattening the contract back into a single text block.
- [ ] Add bounded scrolling or paging for both lists and the detail body so authored content cannot overflow the frame.

Acceptance criteria:

- The desktop layout matches the approved reference composition without copying third-party artwork.
- Long titles, descriptions, checklists, and multiple objectives remain readable and contained.
- Empty main/optional/guidance sections have deliberate empty states and do not leave broken spacing.

### Stage 3 — Interaction, lifecycle, and responsive layout

- [ ] Keep selection stable by objective presentation identity across projection rebuilds and reconnect restoration; apply the documented fallback when the selected entry disappears.
- [ ] Open from the existing tracker action and close through every approved path without duplicate listeners.
- [ ] Block world pointer, wheel, selection, command, building, and spell-cursor handling while the local overlay is open, without emitting a multiplayer pause request.
- [ ] Make objective rows keyboard/pointer accessible within Phaser's supported input model; keep undiscovered placeholders inert.
- [ ] Reflow to stacked lists and details on narrow screens, preserve touch hit targets, and recompute masks/hit areas after resize.
- [ ] Destroy row objects, masks, input listeners, and scene subscriptions on rebuild and shutdown.

Acceptance criteria:

- Opening or operating the quest log never selects an actor, issues an order, moves the camera, or changes deterministic state.
- Live objective transitions update the row and selected details without duplicate objects or lost selection.
- Repeated open/close, resize, reconnect, and scene shutdown leave no stale input handlers or display objects.

### Stage 4 — Verification and visual QA

- [ ] Add focused pure tests for quest-log ordering/redaction and Phaser tests for selection fallback, input guards, and cleanup where the existing harness supports them.
- [ ] Keep `CampaignObjectivesHud.scene`, the new prefab scene, and generated/user-code boundaries structurally synchronized.
- [ ] Run the campaign and Phaser tests and lint targets with the Nx daemon disabled.
- [ ] Run the manual desktop, narrow, touch, long-content, status-transition, save/restore, reconnect, and multiplayer playtest matrix.
- [ ] Capture screenshots for desktop and narrow layouts in the implementation PR.

Acceptance criteria:

- Automated checks pass with non-zero discovered tests.
- Manual evidence covers all approved interactions and the reference-inspired layout.
- The omission and final closure audits find no stale text formatter, hidden-content leak, temporary object, or unsynchronized scene asset.

## Verification plan

Run serialized in the worktree with `NX_DAEMON=false`:

- `pnpm exec nx test probable-waffle-campaign`
- `pnpm exec nx test probable-waffle-phaser`
- `pnpm exec nx lint probable-waffle-campaign`
- `pnpm exec nx lint probable-waffle-phaser`

Manual playtest matrix:

- Desktop campaign: open from tracker, select every section/status, focus an objective, scroll long content, close through every approved path, and reopen.
- Narrow/touch: stacked layout, readable wrapping, scroll masks, hit targets, background input suppression, and resize/orientation changes.
- Objective lifecycle: hidden placeholder to active, checklist progress, completion, failure, optional expiry, selected-objective removal/fallback, and history privacy.
- Save/restore and reconnect: correct projection, stable valid selection, no duplicated rows/listeners, and no mutation of campaign runtime state.
- Multiplayer: one client opens and operates the local log while simulation continues; no pause request or world command leaks from overlay input.
- Cinematic/shutdown: campaign UI suppression wins while active, then restores correctly; leaving the scene cleans up all quest-log resources.

## Risks and guardrails

- Placeholder counts can reveal mission structure even when text stays private; D3 must be explicit.
- Objective kind is authored gameplay metadata. UI grouping must be exhaustive so new kinds fail visibly in tests instead of silently disappearing.
- Do not use array position as persistent selection identity; placeholder entries must use opaque presentation keys that cannot expose authored objective ids.
- Phaser geometry masks and interactive hit areas must be recreated or resized together.
- The screenshot is not an asset license. Any new bitmap/audio asset requires verified reuse rights and attribution before implementation.

## Out of scope

- Changing objective completion rules, mission authoring semantics, rewards, checkpoints, saves, replays, or multiplayer authority.
- A campaign-wide journal, lore codex, dialogue-history redesign, quest tracking/pinning customization, or map-marker system.
- Importing Warcraft UI assets or adding per-objective illustration pipelines without a separately approved and licensed asset contract.
- A general remappable-hotkey framework or general-purpose Phaser modal-stack refactor.

## Continuation prompt

```text
Implement issue #724 from docs/ai/724-improve-quest-log.md after reviewing the answers to D1-D5. Treat those answers as authoritative. Start with Stage 1, keep the plan checklist current, preserve hidden-content privacy and mission-runtime authority, keep every paired Phaser .scene file synchronized, run the listed checks with NX_DAEMON=false, complete the omission and closure audits, and update the draft PR with screenshots and manual playtest evidence. Do not merge.
```
