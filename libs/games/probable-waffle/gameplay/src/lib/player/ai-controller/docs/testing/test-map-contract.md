# Stable maps for skirmish AI tests

## Current boundary

The registered Playwright recipes currently launch the shipped Ember Enclave and River Crossing maps. They exercise
real Phaser gameplay, but those maps can change as game content develops. The [scenario catalog](scenario-catalog.md)
reports their current map labels; it does not pretend frozen CI maps already exist. Moving supported browser recipes to
stable test maps is part of #816. Natural playtests on the latest shipped maps remain useful, but are a separate signal.

## Target map set

| Test map | Preserve | Main uses |
| --- | --- | --- |
| Open economy | Small buildable area, two legal spawns, accessible food/wood/stone/minerals and room for multiple buildings | Opening, labor, supply, production, counters and ordinary economy recovery |
| Bridge crossing | Two banks, one verified ground bridge, water access and legal base sites; no campaign actors | Land-route choice, scouting, raids, attack/regroup/recovery and bounded full-match victory |
| Fortified approach | Legal wall/stair/tower surfaces, a deliberate friendly opening and alternate attack approaches | Placement, rampart defense, breach, withdrawal and friendly clearance |
| Island crossing | A genuinely unreachable-by-land objective, usable water route and landing sites | Optional #822 transport-required runtime cases; not a #759 merge dependency |

The bridge map can begin as an editor-authored copy of River Crossing with unrelated scene objects removed. Copy its
tilemap and relevant navigation/tileset metadata into test-owned assets too; referencing the live product tilemap would
make the supposedly frozen map drift. Keep the test `.scene`, generated `.ts`, asset-pack registration and map definition
synchronized. A later cropped tilemap is worthwhile only if measured runtime cost justifies it and the required
movement/height edges remain intact.
The existing dev-only Sandbox scene is not a substitute for victory tests because its game-mode behavior differs.
Test maps should be unavailable as ordinary public skirmish choices while remaining launchable through the normal
test-lobby/game bootstrap. Map selection and exact coordinates belong in the runtime recipe, not hidden planner state.

## Map and fixture contract

- Freeze a digest of the test scene, tilemap and tile/tileset navigation metadata for CI. Continue using the current
  shared actor definitions so gameplay changes are actually tested. A deliberate test-map edit updates its contract
  and affected recipes together; an incidental product-map edit must not change scenario topology.
- Assert both spawn regions, relevant route connectivity, resource access, buildable footprints, wall-top access where
  applicable, and absence of incidental campaign/starting actors. In particular, ground units must cross the bridge
  without a boat; island-only objectives must not be reachable by ground.
- Use the existing before-tick preset bridge for legal actors, balances, queues and deterministic opponent events.
  It must not inject AI decisions, hidden knowledge or success flags. The AI's orders and actual world effects are
  observed independently through the real command, production, movement, combat and scoring paths.
- Choose a map per invariant: pure Jest needs no map; focused browser cases use the smallest map with the necessary
  topology; continuous matches use the frozen bridge or open-economy map from a legal start. A test of product-map
  compatibility may run separately against mutable shipped maps and must report the exact map/source digest.
- Replace broad 12,000-tick production recipes with focused legal preset worlds where the assertion concerns a
  producer, queue, unit mix or replacement rather than the whole match. Target 200–2,000 ticks per focused case and
  document measured exceptions. Keep a small, separate number of finite continuous matches to prove opening-to-victory
  integration; those can run longer when real terminal play requires it. Derive deadlines from actual construction,
  travel and combat costs, then measure wall time; do not shorten a deadline by skipping the authoritative game path.
- Preserve a fresh game/world per variant even when a CI shard reuses one browser/server process. Failed map setup or
  missing required topology is an infrastructure failure, never a passing AI behavior result.
