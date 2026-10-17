# World access and defense

## Domain-aware access

The access graph represents land, water and flight separately. A region-level connection is insufficient when the assigned actor or formation cannot traverse the actual corridor. Route generation is versioned; invalidation discards stale work without freezing unrelated decisions.

Mixed forces split by executable domain and rejoin only where routes permit. A transport mission owns assembly, embarkation, transit, landing, unloading, passenger handoff, transport release and any return or evacuation. Delivered workers must resume a useful economy role rather than remain cargo-owned.

Flying transports are supported only when a real registered container-capable flying unit exists. The AI may use synthetic pure fixtures to test the contract, but must not advertise unavailable faction capability.

## Current map limitation

The game does not yet ship an island map suitable for full island-expansion E2E coverage. Island-specific runtime rows must remain explicitly `unsupported` or `blocked_by_content` until such a map exists. They must not be reported as passed, and a different ordinary map must not be mislabeled as island evidence. Pure access/transport fixtures remain required meanwhile.

## Placement and expansion

Base identity comes from owned definition-backed main structures. Candidate sites are advisory; shared command application owns final footprint, collision, resource, prerequisite and builder validation.

Placement optimizes the intended service while preserving reserved footprints and movement corridors. Expansions need economic, strategic or recovery value and must not be used as a substitute for an overdue attack.

## Walls, towers and future gates

Each defended base owns a bounded connected fortification graph. It may combine terrain, buildings, wall segments, stairs, towers and an intentional opening. Every construction prefix must preserve friendly worker and army access.

Layout, budget, native-effect reconciliation and order proposals have separate owners under `ai-fortification-*`.
Completion retains the node's attempt identity; a destroyed node advances it before requesting a replacement.
Effect reservations match that current attempt, so an older completed identity cannot certify or suppress its rebuild.
Abandoned plans remain terminal, and losing the protected base abandons its unfinished perimeter. Construction proposals
skip newly blocked footprints and select distinct compatible workers without cargo, active transfers or other actor leases.
Shared native placement and arbitration remain the final authority.

Towers need measured coverage and reachable defensive posts. Wall-top defenders need usable stairs and a withdrawal route. A breach triggers bounded repair, alternate defense or abandonment of a no-longer-useful perimeter rather than rebuilding a duplicate wall graph.

Until a functioning gate prefab exists, the planner preserves an opening; it cannot claim an enemy-only sealed gate. Walls do not stop air units, and a tower is not credited with anti-air unless its real weapon supports that target domain.
