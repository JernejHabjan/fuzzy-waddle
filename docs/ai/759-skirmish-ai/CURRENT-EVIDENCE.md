# #759 current evidence and blockers

Gameplay checkpoint: `0d3864198`. Read only for the selected production repair or evidence lookup.
This file is evidence, not the execution queue; [HANDOFF.md](HANDOFF.md) owns continuation.

**Current step (2026-10-13):** M12 Pass B, combined ten-scope repair batch **in_progress**. Worktree
/home/jernej/.codex/worktrees/7977/fuzzy-waddle, feature/759-skirmish-ai; published base
8ad61c7e373513a8b675537600dbfd3b65467e24. The publication commit owns the checked source; preserve Nx ancestor 59f72e037.

**What changed / why:**

- Movement resolves ready-time dependencies before interpolation and rejects recursive completion failures. Object
  routes avoid occupied endpoints. Routine squads/scouts defer while a native Move to a live owned actor is active;
  defense can interrupt it. This repairs the immediate rally failure and subsequent squad interruptions.
- Construction chooses the nearest permitted footprint. Fair observed bodies block placement without blocking the
  builder's terrain flood. Future schedules include 40 admission ticks before their existing travel/work allowance;
  the eight-work force horizon and committed dates remain fixed. Unchanged visible demand survives route rebuilds.
- Native completion prefixes reconcile the original future-production claim family, freeing its completed queue slot.
  Pending-effect accounting also recognizes the known prefix difference. Queued work does not withdraw a positive
  same-target demand during route rebuilding; fulfilment requires the committed product's actual ready count. Research excludes unfinished producers and
  requires shared queue space before payment, preventing silent delivery and charge-before-queue failure.
- Exposure capture matches complete weapon multisets after canonical ordering and maps actual native selection to its
  consumed index. Pure exposure uses the native floored distance. Producer-only exposure uses resilience rather than
  an essential-economy emergency; the main base, workers and resource service retain protection.
- Dead capture targets retain only their last actually indexed identity, with false current active/alive/indexed flags.
  The opt-in root budget is 12,288. Measured lifetime query/caller histories use 1,024; native identity bounds remain
  8,192, and actor/output/order/movement limits stay unchanged. Overflow and contradictory tails still fail closed.
- Resource-credit projection has a focused owner to satisfy source limits, retaining its existing whole-pile/payment
  joins. No baseline was renewed. Source prices, production times, yields and combat values have not changed.

**Ten-scope acceptance / blockers:**

1. Rally readiness/endpoints/intake: implemented, controls pass; latest native subset retains seven exact Tivara arrivals; fallback and one unbound arrival remain unavailable.
2. Refund usefulness: earlier repaired two-faction 2000-tick runs pass; latest intake source needs the fresh subset.
3. Future capacity/force: fresh Tivara capacity and force pass and transition fulfils; useful arrival failed before the
   intake gate. Keep the fresh exact-arrival/deadline result mandatory.
4. Abandonment: fresh Tivara 2000-tick branch passes; the latest two-faction subset passes both abandonment branches.
5. Exposed recovery: shared-code defects repaired, but coherent unmet-demand/ready-replacement/post-loss output remains
   unproven. Critical producer placement now uses real weapon bands; original loss at 800 precedes output-demand loss
   at 1300. The previous 1800/1300 order could not establish the labelled post-loss demand.
6. Safe/low/no-demand: fair classification and posture repairs are implemented. Skaduwee producer positions account
   for its actual five-tile opponent weapon. Critical/safe still need a coherent common demand that one safe producer
   can serve; stronger experimental forces legitimately demanded throughput capacity and are removed from source.
7. Training/research contention: native preflight and exact event-effect joins are repaired. Retained-reader replay
   proves useful outputs; a fresh complete same-lane strategic result remains required.
8. Capture overflow: root sequence and two measured history limits are corrected with overflow/contradiction controls.
9. Grouped gate: six fresh positive branches ran at 2000: abandonment passes in both factions and Tivara refund passes.
   Tivara future fulfils but two useful outputs remain unavailable; Skaduwee future initially could not be stored.
   A fresh raw-storage rerun retains it and identifies queued-force abandonment. The final queued-force repair run retains commitment until expiry and passes force/retention, but fails prebuild
   timing and useful arrival (`ten-queued-native-final`).
   Skaduwee refund passes after the duplicate-transfer repair. This subset cannot certify all sixteen branches.
   Do not launch another full strategic gate while the recovery control's demand assumption is known to be invalid.
10. Necessity/publication: scoped review retains bounded opt-in identities, closed histories and compact reports because
    they exposed real initialization, claims, research, geometry and interrupted-order defects. No new profiler suite,
    ordinary-game observer, injected AI state or fabricated success is added. Entire ten-scope batch remains open.

**Evidence:** `ten-worlds-closure-2` retained five complete 2000-tick Tivara payloads before stopping for causal repairs.
Tivara future capacity/force pass; abandonment passes; recovery/safe/low controls fail their real geometry/demand/posture
requirements. Zero AI errors/dropped facts in those retained cases. After the two history-limit repairs, replay retains
663 queries/335 caller invocations and four exact useful arrivals; five other rallies were replaced by squad orders.
The new intake gate addresses that actual behavior. `ten-classification-diagnostic`, `-2` and `-3` are shortened
300-tick diagnostics, never strategic certification. They established actual exposure and exposed inconsistent demand
assumptions. Experimental larger-force/lookout setup is retained only in ignored artifacts, not the final fixture.

**Checks:** 174 Phaser suites / 895 tests, 70 gameplay suites / 316 tests, 455 reader controls, 130 affected
history/exposure/overflow controls, three fixture controls and catalog pass. Native/browser/gameplay types pass;
uncached production build passes with its existing initial-bundle budget warning. Latest source checks are named
`ten-*-final-checkpoint.log`; source framing is `ten-final-source.json`. Owned lint/structure has zero errors and 34 existing warnings; targeted formatting and `git diff --check` pass.
Exact native subsets are recorded below; they do not close all sixteen branches. Interrupted checks are not acceptance evidence.

**Additional shared repair / why:** delayed drain calls offered the same six-resource pile at ticks 220/240,
credited at 244/263, and debited it to -6. A per-carrier pending-return guard now refuses the overlapping transfer,
releases on completion/error, and preserves its original resource type through debit/notification. The added control
fails before repair; 24 affected native controls and the fresh 2000-tick Skaduwee refund world pass afterward.

**Artifact necessity cleanup:** expanding joined views exceeded V8's string limit. An experimental generic reference
graph hit its own budget and is removed. Standalone worlds now retain raw capture and actual paused setup once;
`decodeRuntimeProductionWorld` rebuilds derived views with the current pure readers. Missing required setup/capture
and foreign storage versions fail closed, and legacy inline views remain supported. No native record is dropped.
The retained raw Skaduwee future/refund files are approximately 76/20 MB; this is a disk-size observation, not token
savings or a performance certification. `ten-raw-final` stores both complete 2000-tick captures with zero AI errors/drops.

**Next batch / why:** GPT-6.1 Sol / high for one pending-rally/fallback/awaited-route and recovery-control design pass: keep native geometry,
visibility, available army, single-lane throughput, replacement readiness and the actual post-loss demand consistent.
Resolve a unit receiving squad intake before its queued rally becomes active, endpoint contention during transit,
strict awaited route continuity, and the recovery control's single-lane demand assumptions. Implement the settled
corrections together and run the full sixteen-world gate once. Medium is suitable for
settled mechanical changes; recommendations do not change host settings. Actual host model/effort is unknown.
M11, repeated determinism, lifecycle/parity/calibration and release remain open. Implementation Review and Omission Audit trace owners/registrations/consumers/cleanup and all ten obligations.
The separate Final Closure Audit confirms a checked source checkpoint with explicit strategic blockers, not full batch
completion. Stage only task-owned files, commit/push, verify remote SHA, then pause.
