# Classic RTS comparison, strategic depth and difficulty

This review extends the existing 16 stages; it does not replace H1–H9 or add runtime ML. Read [runbook](00-start-here.md), [macro](03-macro-and-access.md), [tactics](05-tactics-and-adaptation.md) and [debug workbench](12-debug-workbench.md). All numbers below are proposed tuning defaults, not measured results.

## Evidence and transfer boundaries

These are primary sources. Historical Blizzard material describes the named games, not hidden internals of present SC2 bots. Warcraft III player guidance informs desired behavior, not a claim about its AI implementation. Source branches/documentation may evolve; preserve the source/version used if implementation consults them. No external implementation code is to be copied.

| Source | What it supports | Decision for this game |
| --- | --- | --- |
| [Blizzard StarCraft AI script FAQ](https://classic.battle.net/scc/faq/aiscripts.shtml) | Distinct melee/campaign assumptions, authored force compositions and expansion-oriented pressure | Keep skirmish bootstrap and adaptive mission plans; do not copy passive attack triggers or campaign resource assumptions |
| [Blizzard Warcraft III combat guide](https://classic.battle.net/war3/basics/combat.shtml) | Unit preservation, mixed forces, exposed expansion pressure and exploiting a won battle | Add bounded pursuit and post-battle exploitation; use this game's real spells/geometry, not WC3-specific heroes, damage or terrain rules |
| [SC2 protocol: Difficulty, AIBuild, PlayerSetup](https://github.com/Blizzard/s2client-proto/blob/master/s2clientprotocol/sc2api.proto) | Separate difficulty and build-style fields; explicit cheat difficulty enum values | Keep difficulty separate from personality; our Easy/Normal/Hard are fair by default, not mappings of Blizzard internals |
| [PETRA BaseManager documentation](https://docs.wildfiregames.com/javascript/petra/PETRA.BaseManager.html) | Local gather-rate/drop-off and worker/builder responsibilities | Retain base-local economic ownership and measured marginal delivered income |
| [PETRA AttackManager documentation](https://docs.wildfiregames.com/javascript/petra/PETRA.AttackManager.html) | Separate attack lifecycle, target-player choice and diplomacy-aware cancellation | Add stable opponent focus and complete mission transitions without whole-army target churn |
| [SC2 API protocol usage](https://github.com/Blizzard/s2client-proto/blob/master/docs/protocol.md) | Observation/action/step workflow and version-sensitive replays | Add an offline step/replay/diff workbench with exact map/config/engine provenance; don't confuse it with live multiplayer controls |

The plan already covers coherent economy, useful duplicate capacity, squads, access/transport, defenses and recovery. The gaps below concern strategic depth, difficulty calibration and reproducible diagnosis—not more unrelated mechanics.

## C1 — opening branches and timing plans

Stages 7/14: author a small versioned opening/transition library for **each registered faction**, resolved from its real tech tree. Start with balanced pressure and safer economic development branches. Emergency recovery is shared, not a separate random opening. Air/naval/expeditionary branches require actual roster and map usefulness.

Each branch stores ID/version, entry conditions, critical versus optional steps, resource obligations, dated army role/capability targets, launch milestone, optional upgrade/tech timing, invalidation evidence and a fallback branch. Reuse stable checkpoint and demand identities across transitions. Existing assets can satisfy either branch; never rebuild just to conform to the selected script.

Choose the initial supported archetype once from configuration/seed. A branch transition follows state/evidence with commitment hysteresis; it does not reroll personality. Scouting can change the next planned purchase or attack route without discarding the whole opening.

A timing mission links a useful ready force to a bounded opportunity: newly available upgrade, completed producer batch, observed enemy tech investment, failed enemy raid or exposed expansion. Wait for a beneficial near-ready upgrade only if the expected delay/benefit beats acting now and H6's mission deadline still holds. If the window closes, explicitly attack with a viable force, change objective or recover; don't hold forever for a perfect roster.

## C2 — desired army size and spending have a source

Stage 7 must compute **total military demand before role percentages**. A 60/40 composition alone cannot determine whether to build six or sixty population.

1. Calculate per-resource spendable budget and conservative delivered income over the planning horizon after essential recovery and due obligations.
2. Calculate usable population: actual cap, timely housing, workers required for useful income, existing combat and accepted queues, plus indispensable transport/support population where the runtime charges it.
3. Generate a bounded mission force request from objective difficulty, compatible visible threat, route/arrival risk, existing available army and readiness deadline. Unknown enemy forces create a confidence bound and information request, not infinite strength demand.
4. Cap the affordable increment by the actual queue schedule/resource forecasts and population; derive desired final army from existing useful force plus this increment. Deficits drive role allocation and prerequisite/producer demand. Preserve replenishment after useful losses.
5. Use initial **soft discretionary spending preferences** per stance: opening 55% economy / 35% army / 10% optional infrastructure-tech; pressure 25/60/15; recover 55/35/10; expand 35/35/30. Apply per-resource accounting, not a made-up universal currency. These are priorities across a rolling horizon, not cash hoarding accounts or mandatory spend quotas. Borrow unused discretionary allocation for a ready justified action after essentials; H5 waiting-exposure caps still apply.
6. Infrastructure/technology that exists only to enable the dated army belongs to that mission's obligation, not a second uncounted consumer. No ceiling becomes a target the AI must spend to reach.

Display the source of total army demand, role split, affordability horizon, opportunity cost and unfilled requests. Cases must cover both scaling up and stopping unnecessary production.

## C3 — scouting asks questions; repeated facts are not new evidence

Stages 4/9/14: attach a decision question to each information mission: where can the enemy expand, where is the missing army, is air production yielding actual flyers, which route is safe, or where can economic pressure succeed? Rank bounded reachable scout objectives by expected decision impact, uncertainty, freshness and scout risk. Coverage percentage alone is not success.

Keep evidence identity/source/tick and distinct-contact counts. Re-reading one sighting on five decision ticks does not prove five independent sightings or a growing army. Confidence changes on permitted new facts, corroboration or elapsed decay; no private queues or hidden current actor IDs. Keep memory representation consistent across difficulty; profile-specific planning delay must not mutate historical facts.

A question expires when answered, obsolete or too costly. Reuse a safe scout and hand its result to the waiting mission/production plan. If the answer is unavailable, choose the bounded lower-risk H6 alternative instead of stalling.

## C4 — opponent focus, pursuit and post-battle exploitation

Stages 9/13: persistent missions track target player/region and protected asset, not only the nearest hostile actor. In multi-opponent games compare feasible value without switching the entire army every time a closer enemy appears. Diplomacy/defeat invalidates target ownership through shared rules; secondary local defense can still address another opponent.

Defenders use an asset-relative interception leash and pursuit budget. Initially allow at most 200 ticks of pursuit beyond the defended approach unless a re-evaluated interception mission proves value and retains home safety. Derive approach distances from actual movement/asset geography, not fixed pixels. A retreating scout cannot drag the army through towers or across the map. Offensive chase is likewise subordinate to the mission; expensive pursuit must beat attacking the exposed economy.

After a won engagement, compare immediate pressure on the exposed core/expansion with recovery/reinforcement. Don't reset to base automatically while the opportunity is open. After a loss, avoid serial suicide reinforcements and use the preserved H6 retreat/regroup contract. Track predicted versus actual local engagement outcomes offline so a consistently wrong estimator is calibrated rather than treated as certainty.

## D — difficulty already exists; make it real and testable

Stages 6/14/15 own the full path: lobby selection -> versioned profile -> host brain -> save/replay/host transfer -> debug/results. There are three initial fair levels. They vary planning tempo and breadth, not access to hidden state or economic legality. No adaptive rubber-banding or silent mid-match difficulty switching.

| Policy | Easy | Normal | Hard |
| --- | --- | --- | --- |
| Decision interval | 40 ticks / 2 s | 20 ticks / 1 s | 10 ticks / 0.5 s |
| Voluntary simultaneous offensive missions | 1 | 2 | 3 |
| Non-emergency composition reconsideration minimum | 80 ticks | 40 ticks | 20 ticks |
| Tactical repertoire | Advance/hold, basic targeting/retreat, required domain/support safety | Full authored initial portfolio | Same legal portfolio with larger evaluation shortlist |
| Opening/transition choice | One forgiving branch per supported archetype | Both supported state-dependent branches | Both plus faster evidence-backed timing response |
| Route/candidate breadth | Existing smaller profile quotas | Existing standard quotas | Existing larger quotas |
| Intentional random errors | Off initially | Off | Off |
| Resources/stats/visibility | Ordinary rules | Ordinary rules | Ordinary rules |

Mission count caps apply to voluntary independent offense, not rescue/local defense, transport child phases or essential scouting. They must not make Easy ignore a home attack. Composition reconsideration is not a forced purchase or a demand for repeated identical sightings; it respects confirmed evidence and goal hysteresis. Imminent visible survival threats may bypass an optional strategic reconsideration cooldown but not the profile's authoritative decision boundary or command limits.

All levels retain supply/worker bootstrap, useful duplicate accounting, essential legal counters, basic retreat, blocked recovery, allied rules, save correctness and fair observation. Never make Easy easier by disabling these safeguards or deliberately deadlocking a queue. Keep the existing 1,200-tick mobile-contact memory default shared; skill differences are how evidence is used, not falsifying observations. Any future seeded legal suboptimal choice needs a separate evaluated opt-in policy and may not affect survival/recovery invariants.

The Normal 10-minute viable-offense gate remains mandatory. Set Easy/Hard milestone bands from the same real map/opening workload and their measured cadence rather than equating smaller command counts with weakness. H1 deadlines scale with actual expected work; slower Easy cannot reset deadlines forever.

Calibration: use mirrored same-faction/profile-only comparisons, standard probe opponents and shared seeds/maps. Publish decision delay, mission concurrency, reaction/composition latency, macro continuity and outcome distributions. Start with 20 paired seeds; expand to at most 100 per comparison when uncertainty is material. Seek a reliably ordered challenge trend across the tested set, not a guarantee that Hard wins every game. If the bands remain indistinguishable, report calibration unfinished and tune authored choices/budgets without cheats; don't relabel equivalent behavior. Human ratings of predictability/fairness/challenge are separate from automated correctness.

## Added cases and ownership

Run focused cases at the owning stage and all cases at Stage 15. These add 12 cases to the prior 103; packet 12 adds 6 more, for 121 named cases before variants.

| ID / stage | Required evidence |
| --- | --- |
| C-01 / 7,14 | Both faction branches preserve completed assets/commitments during evidence-backed transition; no opening restart spam |
| C-02 / 7,13,14 | Upgrade/batch timing launches within the viable window, or explicitly changes plan when it closes; no perfect-roster wait |
| C-03 / 7 | Army total grows with useful affordable mission demand, respects worker/supply obligations and stops at fulfilled demand |
| C-04 / 4,9,14 | Question-driven scouting changes a real decision; repeated reading of the same contact does not inflate enemy mass/confidence |
| C-05 / 9,13 | Bait retreat cannot pull asset defenders into a bad pursuit; won battle creates useful follow-up pressure |
| C-06 / 9,13 | Multiple opponents retain coherent mission focus; diplomacy/defeat cleanly retargets without ignoring local threats |
| D-01 / 6 | Every lobby difficulty selects the exact versioned profile and expected cadence/quotas with no fallback to identical defaults |
| D-02 / 6,14 | Save/load/replay/host transfer preserves difficulty, archetype, scheduling and active plans; no silent profile drift |
| D-03 / 6,14 | Equal permitted observations/rules across profiles; no hidden current state or unadvertised resource/stat bonuses |
| D-04 / 7,9,12 | Easy still opens, produces useful copies, counters legal threats, retreats and recovers; reduced breadth is not broken behavior |
| D-05 / 9,13,14 | Caps and reconsideration cadence affect eligible voluntary activity while independent defense/rescue remains serviced |
| D-06 / 15 | Paired calibration report identifies versions, sample counts/uncertainty and challenge trend; indistinguishable levels remain an explicit tuning failure |

## HTML overview scope

[overview.html](overview.html) is a self-contained, offline-readable explanation of the **planned** end state. Its interactive examples are illustrative, not the real AiBrain or performance evidence. It must remain usable without external libraries/network, show supported/future capability boundaries, link to owning packets and expose no game/debug mutation controls. Commit the page and its focused browser smoke alongside the plan.

Stage 15 runs the documentation-only smoke with `node docs/ai/759-skirmish-ai/overview.smoke.mjs` from the repository root, after installing the repository dependencies and Playwright Chromium. To use an existing local browser, set `AI_OVERVIEW_BROWSER` to its executable path. Screenshots go to ignored `tmp/ai-overview-smoke/`. This checks interactions, responsive overflow/label bounds, no-script readability, local links and the unique 121-case catalog; it is not a replacement for Stage 15 gameplay tests.
