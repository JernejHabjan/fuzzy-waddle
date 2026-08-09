# #729 Campaign resource and housing visibility plan

## Status

- [x] Inspect the current HUD and campaign participant resource setup.
- [ ] Resolve the authored mission-visibility policy.
- [ ] Implement the visible-resource policy and HUD reflow.
- [ ] Verify campaign, skirmish, multiplayer, desktop, and narrow layouts.

## Current boundary

`Resources` currently always creates food, wood, stone, minerals, and housing. `Resource`
subscribes to every resource and housing event, while `HudProbableWaffle` only hides the entire
HUD for cinematics. Campaign players may start with zero resources, but zero is not evidence that
a resource will remain irrelevant.

## Recommended design

Add an explicit campaign mission/participant `visibleResources` configuration, with a
faction/tech-tree fallback only when the mission does not override it. Hide a resource only when
the policy says it is unavailable for the mission; never derive visibility from the current
balance. Housing is visible only when the policy includes it or an available player definition
uses housing.

The HUD should construct and lay out only visible entries, then resize/reflow its desktop and
mobile backdrop. Skirmish and multiplayer must preserve the existing five-entry HUD exactly.

## Agent decision needed

### Visibility authority

**Question:** Should campaign visibility be authored per mission/participant or always derived
from the playable faction's currently available actor costs?

**Recommended default:** Author an explicit mission/participant list with a faction/tech-tree
fallback.

**Rationale:** It is deterministic, supports tutorial/campaign pacing, and lets a mission
introduce a resource later without coupling the UI to temporary actor availability.

**Impact of deferral:** The implementation cannot safely determine what "irrelevant" means.

**Reply with:** `Accept recommendation`, `Use: <alternative>`, or `Defer`.

## Implementation stages

1. Define and validate the campaign resource-visibility contract.
2. Add the policy resolver and unit tests for explicit, fallback, and non-campaign cases.
3. Render/reflow visible HUD entries and update the paired Phaser scene assets.
4. Run focused tests and manual campaign/skirmish/multiplayer layout checks.

## Continuation prompt

```text
Continue #729 in this draft PR. Treat the answered visibility-authority question as final.
Implement Stage 1 only: the typed campaign visibility contract, resolver, and focused tests.
Do not change HUD rendering yet. Update the PR with validation evidence, remaining stages,
and the exact next continuation prompt.
```
