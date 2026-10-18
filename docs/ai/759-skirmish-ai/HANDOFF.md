# #759 start here

Default resume page: read this first, then only the selected package in [REMAINING-WORK.md](REMAINING-WORK.md).
Do not load the full plan directory or archive on startup.

## Current cursor — native construction/placement bindings, authored unrun, 2026-10-18

- Worktree /home/jernej/.codex/worktrees/7977/fuzzy-waddle; branch feature/759-skirmish-ai.
  Batch baseedff27f95c815e2e154a7f177c2a50d1aa586bfb; mechanical hash extraction87d2b0216,
  queue hash/lifecycle behavior982a3aaf5.
  Verify containing publication commit/remote on resume.
  Actual model/effort unknown; no delegation. User requested concrete native bindings plus necessary support/limits,
  and explicitly **no recipe execution, tests, lint, type checks, formatting or similar verification runs**.
- Shared mixed-queue hashing is now implemented in StateHashProjection/serializeActorQueueState and delegated by
  StateHashService: lane/item order, empty lanes, exact work, paid/refund policy and command identity reach both peer
  digest and AI projection. Legacy-only serialization is retained. The large service was mechanically split before
  the behavior commit; no baseline/config exemption changed. Init now replaces old listeners/hash caches and disposal
  removes its exact shutdown handler; transient movement cannot hide an extended differing state tail.
- constructionOrders now creates real unfinished sites through ordinary shared commands at paused tick zero, binds
  actual applied native identities and aborts missing/ambiguous/reused/cross-owner setup. Bounds:8 sites,8 builders
  each, no simultaneous initial construction/gathering or two construction jobs per worker. Native pinned cancellation
  uses unfinished-site teardown/refund, not a new relayed multiplayer cancel command. Setup waits for actual binding.
- Five standalone executable owner worlds are authored: builder loss, intact work, cancellation and both-faction
  safe-room field placement. The first three use apps/portal-e2e/src/e2e/skirmish-ai-construction-worlds.spec.ts,
  with explicit AI_CONSTRUCTION_WORLD_E2E=1 opt-in.
  They reuse lobby/native frames and existing opt-in capture. Assertions require actual original-site payment/work,
  sealed complete intervals, exact completion/retention or refund/removal and useful worker reassignment. Bounded
  summaries retain omission counts; raw native proof uses existing single-copy storage. Interruption is tick80,
  earlier than the native20s/four-builder/50ms fastest completion; actual pre-interruption start is still required.
- protectedRoutes records a pre-build baseline and fresh static tile-envelope paths at every placement, using the
  native terrain/object/height builders without changing live caches. Limits:8 routes, margin0–2,16384 cells/search,
  512 path tiles,256 prefix reads; overflow/unavailable evidence fails. Independent reader joins every actual applied
  Construct to its earlier same-tick placement and exact identity. This is static geometry, **not actual unit transit,
  producer spawn or continuous occupancy proof**. These remain full PLACE-03/WALL obligations.
- skirmish-ai-field-placement-worlds.spec.ts (AI_PLACEMENT_WORLD_E2E=1) adds two safe-room owner branches of PLACE-01.
  Normal faction workers/buildings and native food demand must produce at least two new paid completed fields,
  an aligned pair, reserved-lane exclusion and food delivered from each. Extraction must join the next offered cargo
  and exact transfer; another field/reset, grant, fixture presence or generic food increase cannot substitute.
  Constrained-room, threatened-site, verified alternative placement and actual per-prefix transit branches remain open.
- Authored native definitions: **116/116 supported (100%),0 missing definitions** including30 existing executable
  recipes and86 new specifications. Executable runtime registration remains **30/116 (25.9%),86 unbound (74.1%)**,
  plus4 content-deferred island rows. Pure registration stays111/111. The5 standalone worlds are not counted as full
  manifest registrations:0/5 executed,0/5 validated (unrun, not failed). No new passing scenario or overall behavior
  percentage is claimed. Catalog/inventory distinguish these states; raw artifacts remain outside model input.
- Existing86 specifications remain linked by runtimeRecipeDraft and explicitly unbound for their complete native
  outcomes; reuse pointers/blocker text now identify implemented construction support and shared-queue hashing.
  Native navigation/exposure diagnostics still lack complete per-prefix physical proof. Frozen fortified/multi-opponent
  map bindings remain unavailable. H-31/SEQ-08/D-02 reuse new queue/hash controls but native interruption/peer proof is open.
- No verification gate was run. New/changed metadata tests are authored **unrun**, including safe draft identity,
  exact role/control rejection, queue round-trip/trajectory/hash changes and hash listener lifecycle. Everything is
  **authored unrun**, including TypeScript, formatting and lint. Prior194/16 passes do not certify this changed source.
- **Next implementation (same unfinished binding batch):** add real unit transit/spawn after each placement prefix,
  constrained/safe-versus-threatened field alternatives and useful remote deposit service/home-pressure controls for
  PLACE-01–03/EXP-01/02. Reuse the fresh static prefix checks and five owner worlds; do not rebuild them.
  Author/bind verified wall/stair/shore geometry and native occupied-defense/useful-cost
  oracles for WALL-01–05/H-27/28. Reuse the new construction commands, cancellation/loss and owner-world controls.
  Then bind actual safe-boundary native save/replay and real peer/host continuation for H-31/SEQ-08 using the now
  complete queue projection. No second scenario engine, invented map or generic command-count substitute.
- Historical production8/8, economy16/16 and victory1/2 remain earlier-source evidence. M11, real peer/replay,
  calibration and debug integration stay open. Machinery review/removal remains last. No gameplay/balance changes.
- Preserve unrelated .run/start_portal.run.xml and ALL_VISIBLE fog edits. Publish only owned paths, verify remote,
  report done/why and next/why, then pause. Recommend Sol6.1/high for native binding/restore authority;
  this recommendation does not change active settings.

## What “continue” means

“Continue”, “next step” or equivalent means execute the next unfinished step in this queue, not discuss a new plan.
Resume the current package if its finish condition has not passed; advance to the next dependency-ready package only
after closing it. Respect requested scope/batch size and publication/pause boundaries. No new chat, subagent,
automation or model switch is implied. A newer explicit user instruction overrides this default.
Update this cursor and selected outcome states at each batch boundary. Never reconstruct order from chat/history.
Documentation maintenance does not advance gameplay acceptance.

## Remaining execution order

1. **Validated:** Production: useful delivery, early capacity, producer-loss recovery and queue contention.
2. **Validated (retained):** Economy/technology: delivered income, workers, food/supply, research and useful spending.
3. **Current:** Scouting/combat/access: fair information, targeting, attack/retreat and full-match victory.
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

## Verification policy — current no-execution authoring override

User2026-10-18 requests source review/repairs but **no recipes, tests, lint or similar verification execution**.
This overrides the earlier focused-check policy below for this authoring batch and remains the resume default until
the user authorizes execution. Reading source/diffs, writing files and regenerating the catalog are authoring work.
Keep authored specifications, executable registration, executed checks and passing behavior separate. Publication
does not certify unrun code. Do not run doctor/context/validators merely because a skill lists them.

Earlier policy (retained for a later explicitly authorized gate):

User2026-10-17 defers both-faction full-match victory reruns and the broad regression gate until later.
Use focused causal/negative/recovery controls during the selected grouped implementation batch, plus scoped formatting,
lint and actual-source typing at publication. Do not interpret this deferral as permission to weaken outcomes or claim
scenario completion without native proof. Later, rerun SEQ-01 and only affected native predicates on a frozen candidate.
Diagnostic performance sanity is complete; no further profiling gate is scheduled. Shared balance adjustments remain
authorized when justified (including costs, resource yields and worker capacity). Current field evidence does not
establish food starvation; existing field values remain. Machinery review/removal stays last overall.

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

Registration coverage: pure **111/111 = 100% registered / 0% remaining**; supported runtime
**30/116 = 25.9% registered / 74.1% remaining**, excluding four deferred runtime rows. These are not overall AI completion.
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
