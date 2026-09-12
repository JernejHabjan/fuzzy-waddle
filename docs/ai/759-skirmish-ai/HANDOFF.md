# #759 skirmish AI handoff

This is the cold-start index for unfinished work from #759. Product architecture, testing, and debugging documentation
lives beside the AI controller. Detailed future implementation routes live in linked subissue plans rather than in this
file.

## Cold start

- Branch: `feature/759-skirmish-ai`
- Draft PR: [#814](https://github.com/JernejHabjan/fuzzy-waddle/pull/814), targeting `develop`
- Last published SHA before wrap-up: `bd6d3e4f0e1a5545299aa1ee4ddf291e202f57f2`
- Pinned pre-change baseline: `de47f482889db30420692bf4406fba463d7db296`
- Manifest: `tools/ai/fixtures/skirmish-v1.json`, 121 named scenarios before variants
- Follow-up index: [subissue implementation plans](follow-ups/README.md)
- Unrelated local file: `.run/start_portal.run.xml`; do not stage it with AI work

To resume, choose one open subissue from the table below, read its linked plan first, verify current branch/SHA/status,
and execute only that responsibility. Do not reconstruct old PR stages from Git history.

## Open work

| Issue                                                           | Responsibility                   | Current boundary                                                      |
| --------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------- |
| [#815](https://github.com/JernejHabjan/fuzzy-waddle/issues/815) | Deterministic pure scenarios     | 40/111 pure-required rows mapped at closeout; recalculate first       |
| [#816](https://github.com/JernejHabjan/fuzzy-waddle/issues/816) | Playwright runtime matrix and CI | 10/120 runtime-required rows mapped; no required CI shard yet         |
| [#817](https://github.com/JernejHabjan/fuzzy-waddle/issues/817) | Continuous play and difficulty   | SEQ rerun, isolated baseline, D-06, and soaks remain                  |
| [#818](https://github.com/JernejHabjan/fuzzy-waddle/issues/818) | Strategic debugging              | First semantic summary exists; usability, split, and parity remain    |
| [#819](https://github.com/JernejHabjan/fuzzy-waddle/issues/819) | Real multiplayer AI E2E          | Current Playwright AI runtime is local skirmish, not socket lockstep  |
| [#820](https://github.com/JernejHabjan/fuzzy-waddle/issues/820) | Legacy controller retirement     | Remove fallback only after runtime/save/multiplayer parity            |
| [#821](https://github.com/JernejHabjan/fuzzy-waddle/issues/821) | Source structure and naming      | Main planner names migrated; persisted IDs and large-file debt remain |
| [#822](https://github.com/JernejHabjan/fuzzy-waddle/issues/822) | Island map and scenarios         | Blocked until a real island map is authored and registered            |
| [#823](https://github.com/JernejHabjan/fuzzy-waddle/issues/823) | Save/replay/reconnect lifecycle  | Cross-phase and repeated-match runtime evidence remains               |

Each issue description links its cold-start plan. The plan records exact source anchors, dependency order, commands,
evidence requirements, model/effort guidance, and completion boundary.

## Current evidence

- ECO-08 passed both factions in a real Playwright runtime, including zero-worker bootstrap.
- PRO-01–07 passed as one real Playwright group: 1,442 decisions and 24,040 ticks.
- Latest SEQ-01/02 artifact ran 6,674 decisions and 120,079 ticks but failed terminal/recovery expectations.
- Repairs after that SEQ artifact stop static enemy buildings from creating false home-defense demand and allow terminal
  victory to satisfy post-raid recovery; focused manager tests passed, but Playwright has not rerun those repairs.
- A wider focused gameplay batch passed 7 suites / 82 tests; the portal development build passed.
- Closeout coverage was 10/120 runtime-required and 40/111 pure-required. These are mapped counts, not pass counts.
- The pinned-baseline adapter is metadata-only; isolated baseline execution and D-06 calibration are not implemented.
- Wrap-up migrated the main planner/manager filenames and implementation symbols to responsibility names, added the
  committed strategic intent summary, removed four optional AI IDE profiles, and established source-structure lint.
- Wrap-up focused evidence: gameplay planner/manager Jest 10 suites / 104 tests; Phaser controller/domain Jest 2 suites /
  5 tests; AI/tooling Node tests 9 tests; gameplay/Phaser/portal-E2E lint passed; portal development build passed.
- Source-structure baseline initially records 674 legacy source hashes. New files are strict; editing a baselined violating
  file invalidates its exemption.

Evidence is source-sensitive. Raw `tmp/` artifacts are ignored and may be absent later. Future CI must retain compact
provenance plus failure traces/logs/screenshots as artifacts.

## Stable test policy

- Pure deterministic fixtures repeat three times and compare decisions, state, and canonical hashes.
- Supported runtime-required rows execute through lobby-started Phaser/Playwright matches.
- Representative available maps use seeds 1–5, mirrored sides, and both factions where the scenario applies.
- Selected stress cases expand to seeds 1–20.
- Difficulty starts with 20 paired seeds and expands toward 100 only if uncertainty remains material.
- Release evidence includes at least three 60-minute-simulation soak matches.
- Missing fixtures/work, zero selected work, provenance mismatch, non-finite metrics, unsupported fallback, or missing
  required terminal results are failures.
- Run only one Phaser/Playwright process at a time on one worker; independent clean CI workers may run separate shards.

Stable commands:

```bash
pnpm ai:skirmish:opening
pnpm ai:skirmish:production
pnpm ai:skirmish:land-sequences
pnpm ai:skirmish:report -- --failures-only --details
pnpm ai:tools:test
```

The parameterized Playwright spec is not a complete scenario run without the matrix runner's runtime request.

## Known boundaries

- No island map ships today. Island-only E2E remains content-blocked under #822; pure topology/transport tests remain
  required.
- No registered flying container currently provides shipping runtime evidence. Do not substitute a synthetic capability.
- The current browser runtime uses the shared command/application path but not a real multiplayer relay or peer lockstep.
- The controller still has a legacy behavior-tree fallback when player/faction identity cannot resolve. Normal configured
  skirmishes use the pure brain. #820 owns evidence-backed retirement.
- Schema `V1` remains appropriate for saves, wire data, fixture manifests, repro bundles, and reports. Ordinary manager
  and planner implementations should not carry version/stage names.
- Existing source-structure violations are content-hash baselined. New or changed violating files must be split or receive
  an explicit reviewed baseline decision linked to #821; never regenerate the baseline as a routine lint fix.

## Publication and closure

For every subissue:

1. Re-evaluate every acceptance item against real consumers and negative/recovery paths.
2. Run the focused checks named by its plan; do not claim one evidence layer proves another.
3. Perform an omission audit, repair gaps, then perform a separate final closure audit.
4. Update the issue/plan only with current evidence and proven reusable documentation learnings.
5. Commit only owned changes, push normally, verify the remote SHA, and stop at the issue boundary.

Delete this handoff after all supported manifest rows are required and green in pre-merge CI, explicit content blockers
have durable owners, calibration/soaks/human review are recorded, legacy and naming migrations are closed, and no source,
skill, wiki, PR, or issue depends on this file.
