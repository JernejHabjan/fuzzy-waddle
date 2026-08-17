# #729 Scenario resource and housing visibility plan

## Status

- [x] Inspect the current HUD, campaign content, participant resource setup, and launch contracts.
- [x] Confirm visibility is authored per mission and reusable by non-campaign scenarios.
- [ ] Implement the scenario-agnostic presentation contract and campaign authoring support.
- [ ] Implement the resolver, visible HUD projection, and layout reflow.
- [ ] Verify campaign, skirmish, multiplayer, desktop, and narrow layouts.

## Confirmed decision

Resource and housing visibility is an explicit per-scenario policy. Campaign missions author the
policy per mission, but the contract and resolver must live outside the campaign-only runtime so
future tutorials, challenges, custom scenarios, or other game modes can use the same mechanism.
Current balances and currently buildable actors are never visibility authority.

## Current boundary

`Resources` currently creates food, wood, stone, minerals, and housing unconditionally. `Resource`
subscribes to every resource and housing event, while `HudProbableWaffle` only hides the entire HUD
for cinematics. Campaign mission content already has a validated, revisioned authoring boundary and
participant starting resources, but no generic game-mode presentation policy. A zero balance does
not prove that a resource is irrelevant.

## Proposed contract and authority

Add a shared `ScenarioPresentationPolicy` (or equivalently named contract) to the probable-waffle
protocol, with a focused resource HUD member:

```ts
interface ScenarioResourceHudPolicy {
  readonly visibleResources: readonly ResourceType[];
  readonly showHousing: boolean;
}
```

The policy is copied into the launched game-mode/session data so the HUD consumes one resolved
runtime authority regardless of where the scenario originated. Campaign mission JSON exposes the
same typed member and its schema validation; the campaign launch adapter copies it into runtime
game-mode data. Future scenario producers can populate the shared runtime contract without importing
campaign code.

Resolution order:

1. Use the launched scenario's explicit resource HUD policy.
2. If absent, show all resources and housing to preserve existing skirmish, lobby, matchmaking, and
   saved-game behavior.

Do not infer a fallback from faction, actor costs, resource balance, or tech-tree state. Those inputs
can change during a run and would make presentation nondeterministic. If a future scenario needs to
reveal a resource during play, add a typed, persisted scenario-policy update event as a separate
extension; the initial implementation keeps the policy static for the run.

## Implementation stages

### Stage 1: shared scenario contract

- Add the scenario presentation/resource HUD contracts to the probable-waffle protocol.
- Add the optional policy to the authoritative game-mode/session data and serialization path.
- Add campaign mission authoring and JSON-schema support for the same policy.
- Validate resource values, reject duplicates, require an explicit housing boolean, and preserve
  backwards compatibility when the policy is absent.
- Add protocol, campaign-loader, schema, and saved-data compatibility tests.

Acceptance criteria:

- A campaign mission can declare its exact resource order and housing visibility.
- A non-campaign game-mode producer can supply the same policy without depending on campaign code.
- Existing game data without the field resolves to the unchanged five-entry HUD.

### Stage 2: single resolver and projection

- Add one pure resolver at the game/HUD boundary that returns the ordered visible entries.
- Keep resource subscriptions/state available to simulation even when an entry is hidden; this is a
  presentation policy, not an economy mutation.
- Project housing separately from `ResourceType`, using `showHousing` rather than a sentinel value.
- Unit-test explicit subsets, resource ordering, no resources, housing-only, and default fallback.

Acceptance criteria:

- Hidden entries do not render or reserve layout space.
- Hidden resources continue to update correctly in simulation and appear with the current value if a
  later typed policy-update extension reveals them.

### Stage 3: HUD construction and responsive layout

- Make `Resources` construct only the resolved entries and calculate the backdrop from the resulting
  count.
- Reflow rather than leave gaps on desktop and narrow/mobile layouts.
- Update paired Phaser scene assets only where generated/editor-owned structure requires it.
- Keep cinematic whole-HUD visibility behavior independent of resource-entry visibility.

Acceptance criteria:

- Any ordered subset, housing-only, or an empty policy renders without overlap or stale background.
- The default skirmish/multiplayer HUD remains visually identical.

### Stage 4: authored rollout and validation

- Author the intended policy per applicable mission rather than sharing one campaign-wide default.
- Run formatting, focused protocol/campaign/Phaser tests, type checking, and builds.
- Manually verify at least one restricted mission, an unrestricted mission, skirmish, custom lobby,
  matchmaking, desktop, and narrow viewport.
- Verify save/load and reconnect preserve the resolved policy.

## Risks and guardrails

- An empty `visibleResources` list is valid and distinct from an absent policy.
- Resource order is authored UI order and must survive serialization.
- The runtime policy is authoritative after launch; reconnecting clients must not reload a different
  mission-file revision and derive another HUD.
- Scenario visibility must not change resource ownership, costs, collection, caps, or victory logic.

## Remaining questions

None block implementation. Exact policies for individual missions can be authored alongside their
content and reviewed as data changes; uncertainty for one mission should not delay the shared
contract and resolver.

## Continuation prompt

```text
Continue #729 in draft PR #762. The approved rule is an explicit per-scenario resource/housing HUD
policy: campaign missions author it per mission, while the shared runtime contract also supports
future non-campaign scenarios. Implement Stage 1 only, including typed contracts, campaign JSON
schema/loader support, runtime serialization, backwards-compatible defaults, and focused tests.
Do not change HUD rendering yet. Update the draft PR with validation evidence, remaining stages, and
the exact next continuation prompt. Do not merge.
```
