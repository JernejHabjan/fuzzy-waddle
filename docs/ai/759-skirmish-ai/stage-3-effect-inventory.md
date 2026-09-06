# Stage 3 shared-effect inventory

Status: `implemented_unvalidated` at implementation commit `75dcbc3b`. This is the cold-start map for the shared command/application work completed in Stage 3. All named tests are `authored_not_run`; the user-directed policy reserves every test, lint, type, build, format, browser, and runtime execution for Stage 15.

## One authority and lifecycle

`CommandBusService` stamps `{commandId, commitmentKey, source, authorityEpoch, sequence, intentId?, effectId?}`, emits `dispatched`, admits an effect once, and records `applied`/`active`/terminal outcomes. The authority state persists next sequences, per-player processed watermarks, bounded detailed IDs/outcomes, active commitments, and multi-actor terminal progress. A save, reconnect, replay, or host migration must restore/fence this state before applying a command tail.

`AiCommandReconciliation` owns the per-AI pending window. Dispatch is never treated as application. Missing application/terminal evidence becomes a bounded `technical_fault`; stale epochs, processed sequences, duplicate command IDs, duplicate active commitments, and overflow are rejected without permitting a duplicate effect. `ai-command-outcome-adapter.ts` is the read-only bridge to the Stage 2 pure contracts. Stage 6 may consume this bridge but must not create another command authority.

Useful duplicates remain legal: production commands receive distinct default commitment identities, while construction suppresses only the same active `siteKey`. Separate useful producers, deposits, houses, towers, walls, resource sites, and repeated units therefore remain possible. Stages 6–7 own demand-led counts and capacity decisions; Stage 3 only prevents duplicate application of the same accepted intent.

## Effect routes

| Effect family | Shared input and server boundary | Authoritative runtime application | Terminal evidence and durable links |
| --- | --- | --- | --- |
| Production | `PRODUCTION`; server validates delegated host-AI identity, actor ownership, actor name, epoch/sequence metadata | `QueueCommandSystem` revalidates owner/capability/resources and `ProductionComponent` adds one command-linked queue item | Queue emits applied/active, then completed with spawned actor ID or failed when no legal spawn exists; cancellation settles the original item; queue context saves with the actor |
| Research | `RESEARCH` / `CANCEL_RESEARCH`; typed research and owned producer | `QueueCommandSystem` plus `ResearchComponent` eligibility and shared queue | Applied/active links `research:<type>`; completion/cancellation settles the command-linked item; queue state persists |
| Queue cancellation | `CANCEL_PRODUCTION` / `CANCEL_RESEARCH`; queue address revalidated at application | Existing production/research cancellation and refund ownership remains authoritative | Cancel command and affected original queued commitment each receive their own terminal outcome; no predicted refund is treated as applied |
| Construction | `CONSTRUCT {actorName,tileVec3,siteKey}`; safe identifiers, owned builders, known actor type | `SharedCommandApplicationService` checks builder capability/health, prerequisites, current resources, navigable footprint/collisions, spawns one normal construction site, then assigns builders through `ActionSystem` | Applied/active links the site actor; finished/destroyed site completes/fails; active same-site duplicates reconcile to the existing site; site-key ownership clears when the site leaves the world so a later rebuild is legal |
| Unit move | `MOVE`; owned addressable actors and finite vectors | `MovementSystem` deterministically flocks, then queues/overrides the normal pawn order | Applied per pawn; saved `OrderData.commandContext` produces completed/cancelled/failed terminal evidence; destroyed pawns settle interrupted command-linked orders |
| Attack/scout/worker/support orders | `ACTOR_ACTION`; order/target/tile payload, owned actors | `ActionSystem` revalidates live target, team/neutral relation, enemy visibility, capability, construction state, damage state, resource source/drain, and container capacity before normal pawn execution | Applied per pawn, then the shared pawn lifecycle reports terminal status. Achieved stop reasons use an explicit allowlist; capability, reachability, validation, teardown, and unknown reasons fail closed instead of accidentally becoming success. Scout and tend use the existing move/gather semantics; no second strategic mutation path exists |
| Stop | `STOP`; owned actors | `ActionSystem` clears normal pawn work | Immediate completed outcome per addressed actor; existing human stop gesture is preserved |
| Rally point | `SET_RALLY_POINT`; finite tile/world vector and optional target actor | `ProductionComponent` alone applies location/actor rally state; legacy replay `MOVE` rally remains compatible | Immediate completed outcome linked to `rally-point`; selected non-producers are excluded so multi-actor reconciliation cannot hang |
| Board | `ACTOR_ACTION/EnterContainer`; owned passenger and allied live container | Existing pawn/container path performs capacity and ownership checks | Pawn order lifecycle settles the passenger command; container membership remains actor save state |
| Unload | `UNLOAD {passengerIds?,tileVec3?}`; owned container | `ContainerComponent` revalidates shore state and current cargo, then uses normal unload placement for all or the selected subset | Completed outcome links actual unloaded passenger IDs; missing cargo/unsafe water unload rejects explicitly; Stage 8 owns route/landing planning |
| Spells and autocast | `CAST_SPELL`; safe spell/target IDs and logical tile. Human cursor and pawn autocast both dispatch it | `SpellCastingSystem` revalidates caster cooldown/capability, target type, range, visibility/relation, land/water/air domain, and polarity. Projectile impact is queued on simulation ticks; tween is presentation only | Instant effects settle immediately. Projectile effects save on `SpellComponent` and settle at due tick or explicitly fail on caster destruction. AOE zones and summon expiries save/restore independently; stable effect/world IDs join trace and replay |
| Proximity conversion | No command: this is a normal world rule, not AI ownership mutation | `ConvertibleComponent` canonically selects active/live contenders by distance, player, then actor ID and calls its existing owner transition | Conversion emits `convertible-converted` with owner/trigger actor and persists accumulated interval/converted state. AI may approach but cannot set owner directly |
| Concession | `CONCEDE {reason}` with an empty actor set; host delegation rules still apply | `SharedCommandApplicationService` invokes `GameModeConditionChecker.applyConcession`, which uses the normal eliminated-player and actor cleanup path | Completed only when the mode accepted elimination; otherwise rejected. A technical command fault is never converted into concession |

## Persistence, replay, and diagnostics

- `ProbableWaffleGameStateData.commandAuthority`, `AIBehaviorTreeStateData.commandReconciliation`, command-linked queue/order records, pending spell impacts, AOE zones, summon expiries, and conversion progress are the durable owners.
- `SnapshotService` captures command authority/effect timers; `ReconnectService` restores them before command-tail playback. `HostMigrationService` advances the authority epoch on every peer before a new host can resume AI dispatch.
- `ReplayRecorderService` stores the ordered command-outcome stream. `ReplayPlaybackService` compares every recorded non-dispatch outcome and diagnoses mismatches, missing outcomes, and unexpected extra outcomes while remaining backward-compatible with archives that have no outcome stream.
- The AI debug panel's **Command Authority** view exposes health, epoch, terminal watermark, bounded pending IDs, and recent outcome/reason/world links. It is read-only and does not rerun planning.

## Authored Stage 15 gates

- Protocol transport guards: every new payload family, execution metadata, replay outcome shape, malformed outcome rejection.
- Server validator: host-delegated AI command, spoofed source, identity mismatch, rally payload, ownership and actor-address rules.
- H-06/H-07: missing terminal evidence after applied work and completion whose resulting actor has already disappeared.
- H-08/H-09: old-epoch fencing and processed-watermark rejection after detailed-ID eviction.
- H-10: bounded pending overflow produces an explicit technical outcome while retaining the configured window.
- Multi-actor reconciliation, applied-versus-completed timing, saved pending frontier continuation, canonical runtime-to-brain ordering, team/neutral relation, and simultaneous conversion ordering.

Stage 15 must add/run the real-scene vertical slices for production, construction, movement/combat, cargo, spell impact/save continuation, concession, replay, reconnect, and host replacement. Authored unit/contract fixtures do not substitute for those runtime scenarios.
