# Stage 14 — adaptation and technology boundary

`AiStage14AdaptationManagerV1` is the only owner of adaptive counter demand and optional technology rationale. It runs after Stage 7 macro and Stage 13 tactics, so it can refine future production without replacing essential economy, supply, recovery, transport, tactical, or shared-command authorities.

## Input and trust boundary

- Enemy counter evidence comes only from a committed visible contact's effective movement/combat/container facts. An evidence record persists its type, source contact, observed tick, confidence, permitted facts, and consecutive evaluation count.
- Seeing the same contact again can raise persistence from one to two eligible evaluations. A remembered contact uses the observation pipeline's tick-decay shape but resets its consecutive-evaluation count, so memory cannot itself trigger a transition. Neither form can multiply enemy strength, create a new source contact, or inspect hidden queues, research, health, cooldown, or fog state.
- Research candidates are projected by the Phaser observation adapter only when the owned `ResearchComponent` reports the candidate legal in the current `TechTreeService`. Cost, time, refund, and unit/spell benefit are copied from the runtime research definition at the observation boundary.

## Decision rules

1. A non-emergency role transition requires two consecutive eligible evaluations and the profile's `compositionReconsiderationTicks` cooldown.
2. Real counter targets are capability constrained: anti-air requires a real air-targeting product, water control a water-moving water-targeting product, and support/range/fortification alternatives require an actual catalog entry. Missing capability leaves the target absent; it never invents a siege unit.
3. Ready actors plus accepted Stage-14 effect reservations count toward each role. This permits useful duplicate units while a genuine deficit remains and prevents repeat queue spam while the shared command outcome is unresolved.
4. Existing production is retained. This owner emits no cancellation; a future cancellation owner must prove utility greater than real paid/refund/progress cost before it changes that policy.
5. Research score estimates current plus likely 1,200-tick beneficiaries, then subtracts real cost, queue delay, and a survival floor. The shared `RESEARCH` command still makes the final authorization/application decision.

## Archetypes, saves, and debug

The deterministic profile selection supports balanced, rush, macro, turtle, and tech personalities. They change legal opening force/supply/research priorities while retaining the same worker, supply, prerequisite, recovery, observation, and command rules. Capability-dependent air-control, naval, and expeditionary saved identities are accepted only when roster/map/transport support exists; otherwise the manager makes one recorded deterministic fallback to balanced. Ordinary threat response does not reroll a supported personality.

`AiBrainStateV1.economyProduction.adaptation` is canonical, migrated for old V1 saves, and projected as `AiDebugSnapshotV1.adaptation`. The **Production & Tech** panel displays the recorded evidence, targets, selected research score, archetype, and cancellation policy without replanning or live-world reads.

The authored pure cases live in `ai-stage-14-adaptation-manager.spec.ts` and `tools/ai/fixtures/stage-14-adaptation.json`. `tools/ai/fixtures/difficulty-calibration-v1.json` defines the paired D-06 runtime comparison: identical seed/map/faction/opponent pairs across difficulty, a pinned baseline, fair-rule invariants, telemetry and fail-closed runtime evidence. They remain `authored_not_run`; Stage 15 owns actual shared-command, level-application, save/host-transfer, second-match, faction/map, and calibration validation.
