# RTS AI combat and strategy handoff

## Status

- A1–E3 implementation is on `feature/759-skirmish-ai`. Retained match evidence is scoped below.
- This cursor records current acceptance and evidence; architecture and durable coverage remain in the linked [combat and strategy](../../../libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/architecture/combat-and-strategy.md), [economy and production](../../../libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/architecture/economy-and-production.md), and [coverage status](../../../libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/testing/coverage-status.md) documents.

## Delivered

- **A1–A3 combat:** full-squad retreat depends on committed losses or catastrophic exposure; endangered units may fall back individually while the squad stays engaged. Retreat/recovery reasons are distinct, and AI pursuit is bounded to 10 tiles before returning to its strategic mission. Explicit player attack orders remain deliberate.
- **B1–B2 openings:** deterministic archetype choice uses match seed, AI player and faction; it waits for the first committed roster/map observation, excludes unsupported plans, persists the resolved choice safely, and supports older saves. Opening-specific production and fallback are connected.
- **C1–D2 harassment and domains:** raid strength responds to value, threat and opportunity cost, with disengagement and survivor release. Air/naval plans scale with useful targets and affordability, count commitments once, require legal production, and decline unsupported routes.
- **E1–E3 fortifications:** Tivara Watch Tower/Wall/Stairs cost 150/15/15 stone. Staged construction checks whole-route and prefix connectivity, builder/surplus availability, and recovery/rejection reasons. Tower clearance uses its real 3×3 footprint.
- **Performance and diagnostics:** decision-work bounds and camera-bounded fog rendering are in place; diagnostic output identifies map and seed.

## Final acceptance evidence

- **WALL-02 hostile opening, Skaduwee:** `1794551617949-diagnostic_passed.json`, seed 759941. The hostile unit physically reached the protected-route opening at tick 1945; the paid Watch Tower completed at 2009; its post-prefix attack applied at 2010 and damaged the original home from tick 2080.
- **WALL-02 hostile opening, Tivara:** `1794551783961-diagnostic_passed.json`, seed 759940. The hostile unit reached the opening at tick 1920, the paid Wall completed at 1987, and the original home took damage from tick 2072.
- Both reports record a staging arrival and later damage after a paid construction step. Skaduwee completed a Watch Tower, and the staging arrival preceded its completion. This evidence covers the hostile branches and leaves the full friendly transit matrix outside these runs.
- Ordinary Ember match, seed 67795: Easy AI won with a Turtle opening, completed a stair and two walls for 45 stone, and retained whole/prefix route connectivity. Both sides were Tivara.
- Focused controls recorded earlier in this batch: gameplay fortification 696/696; Phaser catalog 1,303/1,303; native placement/fixture 7/7; opening eligibility 3/3, selection 5/5, brain-state validation 5/5, and controller integration 10/10. Scoped ESLint and `git diff --check` pass.
- No broad scenario family, CI matrix, or full campaign was run. A gameplay project-wide TypeScript command has pre-existing errors in untouched specs; filtered diagnostics for the changed opening-eligibility files were clear.

## Follow-up review

- Engaged squads now evaluate same-step casualties before choosing to keep fighting. Living units assigned elsewhere no longer count as casualties. Repeated AI attack orders preserve the pursuit limit, and a stale tactical decision cannot cancel a new strategic raid withdrawal.
- Hard waits up to 400 simulation ticks for a map access graph before locking in its opening. Expeditionary openings require compatible map access. Naval openings can stay active while the opening build is underway and scouts are still looking for an objective.
- The match results above predate these review fixes.

## Scope boundary

The goal covers the local single-player A1–E3 changes. Broad automation, CI, multiplayer reliability and difficulty calibration are tracked separately.
