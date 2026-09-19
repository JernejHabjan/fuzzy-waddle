# Authoritative preset-world runtime fixtures — #826

## Outcome

Focused browser scenarios reach the behavior under test quickly by authoring the initial world and deterministic events,
while still using real actor definitions, observation projection, AI decisions, shared commands, Phaser effects, and
independently measured outcomes. They complement rather than replace full lobby/map matches.

Recommended agent: `gpt-5.6-sol`, high effort for the first world-setup and authority boundary; then
`gpt-5.6-terra`, medium effort for fixture families. Estimated effort: 2–4 focused sessions.

## Current boundary

The typed bridge and focused `SCOUT-05`, `DOMAIN-06`, `RAID-02`, and `PRO-05` Playwright proofs are implemented.
Report `1789835431357-passed.json` covered all four in one browser process: 3,709 decisions, 72,960 ticks, and
287,506 ms; repeated causal outcome digests matched. Initial queues use the real queue component after catalog,
tech-tree, and payment checks. Topology is selected by map, vision arises from authored actors, and scheduled events
use the simulation tick. The only remaining closeout item is an apples-to-apples wall-time/process-start measurement
against the corresponding natural-map invariant, followed by a final issue audit and plan retirement.

## Cold start

Read only:

1. `libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/docs/testing/runtime-e2e.md`
2. `apps/portal-e2e/src/e2e/skirmish-ai-runtime-variant-runner.ts`
3. `libs/games/probable-waffle/phaser/src/lib/player/ai-controller/testing/ai-runtime-scenario-driver.ts`
4. `libs/games/probable-waffle/phaser/src/lib/player/ai-controller/testing/ai-runtime-browser-test-config.ts`
5. one slow scenario recipe and its first failing predicate from #816

Run `pnpm agent:doctor` and `pnpm agent:context -- --issue 826` before implementation.

## Boundaries

- Author authoritative initial actors, resources, ownership, queues, visibility, topology, tick, and scripted opponent
  events through real definitions/components. Never inject desired AI brain state, decisions, success, or hidden knowledge.
- Keep full natural-map matches for opening continuity, emergent interaction, terminal results, soak, and calibration.
- #826 owns the reusable setup contract and representative proof. #816 owns scenario registration, coverage counts,
  CI sharding, and retained artifacts. #815 owns pure fixtures.

## Implementation order

1. Measure one current slow scenario and identify prerequisites irrelevant to its tested invariant.
2. Add a typed, validated preset-world request to the existing runtime bridge. Fail closed on unsupported actor names,
   illegal ownership/position/resource values, fixture/source mismatch, or zero exercised work.
3. Build the world through production actor definitions and authoritative services before the AI begins observing it.
4. Add deterministic opponent-event primitives such as attack, reinforcement, producer loss, and visibility change;
   keep them behavioral inputs, not planner outputs.
5. Prove at least defense/domain, production/replacement, and mission recovery cases through real command application and
   world outcomes. Compare repeated seed digests and ensure hidden-state variants remain observationally identical.
6. Record wall time and process starts against the full-map version without weakening assertions. Add the supported
   fixture mode to #816's manifest-derived runner and operator docs.

## Completion

- A focused runtime case can begin near its causal boundary and finish in a bounded short run.
- It observes real AI decisions and authoritative effects; deliberate fake-success and hidden-information fixtures fail.
- Repeated seed/setup produces identical initial observation and outcome digests.
- Full natural-match coverage remains registered for behaviors that require it.
- Focused Phaser/Jest, one representative Playwright fixture, lint, omission audit, final closure audit, commit, push,
  GitHub update, and plan triage are complete.
