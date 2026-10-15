# #759 start here

Default resume page: read this first, then only the selected package in [REMAINING-WORK.md](REMAINING-WORK.md).
Do not load the full plan directory or archive on startup.

## Current cursor

- Worktree: `/home/jernej/.codex/worktrees/7977/fuzzy-waddle`; branch: `feature/759-skirmish-ai`.
  Tested base: `f3c5dd458ec72404c77b7ca050e86a1fceef3f5b` plus the containing checkpoint's changes.
  Verify actual HEAD/remote on resume. Commit/push at coherent boundaries is authorized; pause after publication.
- **Current: Package 2 economy/technology, 11/16 outcomes passed (68.75%); 5/16 remain (31.25%).**
  ECO-01/02/03/04/07 and TECH-01–06 pass. ECO-08 fails the first-military-building deadline and repeated workforce
  outcome digest. ECO-05/06 and H-16/H-18 lack native setups. Do not advance to Package 3.
- Done / why: both openings secure Granary/Field income before military infrastructure; unaffordable construction
  leaves workers gathering missing resources, and prior food/build claims prevent double assignment. Existing main
  supply avoids an unnecessary opening house; later queued population can still trigger a distinct housing builder.
  Public air-production clues admit one precaution; actual flyers scale counters and admitted deficits refill during
  cooldown. No balance values changed.
- Evidence: final `economy-supply-opening-final/1792082168359-failed.json` passes ECO-04 (3 worlds), ECO-07 (6),
  PRO-04 (8). ECO-08's 5 worlds all prove renewable food; ordinary starts retain 4 workers, 20 food and 110 wood at
  tick 3000 without the first producer. Growth repeats retain 8/9/8 workers but diverge after tick 900 despite exact
  capture ticks. The clock overshoot defect is fixed; the remaining divergence is not explained by sampling overshoot.
- Checks: all selected pure assertions pass (26 suites / 118 tests), affected gameplay 70 tests, Phaser clock/fixture
  controls 15, E2E oracle controls 9. App/gameplay/E2E types and scoped lint pass. Standalone Phaser types retain eight
  pre-existing errors. [CURRENT-EVIDENCE.md](CURRENT-EVIDENCE.md) owns exact artifacts/provenance and limitations.
- **Next:** one grouped economy-recovery batch: diagnose slow opening wood/food delivery and post-900 growth
  divergence; add ECO-05/H-16 aggregate-budget/low-delivery and ECO-06/H-18 depletion/supply-loss native branches.
  Reuse current capture paths, preserve deadlines/determinism and the 200-resource start. Publish/pause after the
  coherent batch; Package 1 remains 8/8 validated and its composition regression remains green.
- Recommended next model: **GPT-6.1 Sol / high**, because the remaining failures need causal economy and timing
  investigation. Actual host settings are unknown; no model switch is implied.

## What “continue” means

“Continue”, “next step” or equivalent means execute the next unfinished step in this queue, not discuss a new plan.
Resume the current package if its finish condition has not passed; advance to the next dependency-ready package only
after closing it. Respect requested scope/batch size and publication/pause boundaries. No new chat, subagent,
automation or model switch is implied. A newer explicit user instruction overrides this default.
Update this cursor and selected outcome states at each batch boundary. Never reconstruct order from chat/history.
Documentation maintenance does not advance gameplay acceptance.

## Remaining execution order

1. **Validated:** Production: useful delivery, early capacity, producer-loss recovery and queue contention.
2. **Current:** Economy/technology: delivered income, workers, food/supply, research and useful spending.
3. Scouting/combat/access: fair information, targeting, attack/retreat and full-match victory.
4. Placement/fortification/recovery: useful construction and bounded recovery from stalls/losses.
5. Authority/multiplayer/lifecycle: exactly-once effects, synchronized peers, save/replay and clean next match.
6. Continuous play/difficulty: complete matches, paired calibration and required long-play checks.
7. Debug/legacy/closure; **machinery review/removal is the last implementation/review task**.

Packages organize outcomes, not separate sessions. Collect related gaps across packages and repair shared owners
together. Reuse existing tests before authoring replacements. No new machinery expansion is scheduled.

## Model batches and pause contract

Use Sol for unresolved causal/design questions; economical models can implement settled contracts when the user chooses.
No per-file/scenario model-switch pauses. Commit/push task-owned changes, verify remote equality, report and pause at
the agreed coherent boundary. Do not merge, force-push or create a PR unless separately authorized.

## Final validation gate — not during the implementation sweep

The correctness gate is **active**; old test-deferral instructions are historical. Use affected controls during repairs
and grouped checks at stable boundaries. Repeat expensive runs only after relevant changes or to answer a named question.
Never weaken deadlines, usefulness, fairness or authority assertions. Diagnostic performance sanity is complete;
no further profiling gate is scheduled. Shared balance adjustments are authorized when justified: record old/new values,
purpose and affected checks. Latest gameplay checkpoint changed no prices, times, yields or combat values.

## Batch report and progress

Use this format at every batch boundary and whenever the user asks what was done or what comes next:

- **Done / why:** two to four short bullets explaining the actual behavior changed and why it helps gameplay or
  trustworthy evaluation. Use plain language; name files or implementation details only when they help understanding.
  Distinguish authored changes from tested or validated outcomes, and state any remaining failures plainly.
- **Progress:** name the current package/selected outcomes, then give passing and remaining counts and percentages
  with their exact denominator. Distinguish failed outcomes from unavailable setups; a subset pass is not package closure.
- **Next / why:** two to four short bullets naming concrete next repairs and what each will enable or prevent.
  Group related work into one batch and explain why it belongs together; avoid vague labels such as “continue validation”.
- **Publication / recommendation:** briefly state commit/push and pause status, then the recommended next model/effort
  and one reason. Do not imply that a recommendation changes the active settings.

Keep the report self-contained and concise. A documentation-only update reports the instruction change and leaves
gameplay progress unchanged. The execution plan links to this format rather than maintaining a second template.

Registration coverage: pure **59/111 = 53.2% registered / 46.8% remaining**; supported runtime
**26/116 = 22.4% registered / 77.6% remaining**, excluding four deferred runtime rows. These are not overall AI completion.
Reconcile behavior evidence per selected package; do not invent a global completion percentage.

## End-of-gate machinery necessity review

Do this last, after required gameplay, integration, calibration, debug and legacy work. Earlier verdicts are evidence,
not an interim removal queue. Recheck evidence affected by final simplification, then close.

## Read only when needed

- [Execution plan](REMAINING-WORK.md): selected package, finish condition and report rules.
- [Scenario inventory](SCENARIO-INVENTORY.md): selected family/IDs, setups/outcomes and registration gaps.
- [Current evidence](CURRENT-EVIDENCE.md): selected production failure/pass and artifact/provenance lookup.
- [Follow-up index](follow-ups/README.md): selected issue contract; read relevant sections, not full historical ledgers.
- [Historical handoff](archive/HANDOFF-history.md): exceptional provenance lookup only; never a default startup read.

M11, supported scenario coverage, multiplayer/lifecycle/calibration and final machinery review remain required.
DOMAIN-03/04, H-29 and SEQ-05 runtime island content are deferred; required pure contracts remain, M13 is unscheduled.
