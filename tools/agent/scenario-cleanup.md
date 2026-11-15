# Scenario cleanup proposals

The manifest contains 121 scenarios. A scan found repeated actor rosters within many native fixtures. Matching
rosters suggest shared setup opportunities. Other inputs and assertions still need comparison before consolidating runs.

## Reuse starting worlds

| Cases | Observed repetition | Proposed cleanup |
| --- | --- | --- |
| SCOUT-02 | Five variants per faction share a roster. | Share faction worlds and vary visibility, movement, health and queues. Keep fairness comparisons. |
| WALL-02 and WALL-04 | Up to three and four variants respectively share a roster. | Share wall layouts and vary openings, damage and repair conditions. Keep access and breach controls. |
| FIGHT-01 | Up to four variants share a roster. | Share combat setup and vary reinforcements, losses and outcomes. Keep distinct retreat and engagement checks. |
| EXP-01 and EXP-02 | Up to three variants per fixture share a roster. | Share expansion worlds and vary pressure, withdrawal and recovery. Keep safe and threatened controls. |
| H-06–H-15 | Multiple variants share rosters within each fixture. | Reuse authority and resource worlds with explicit fault, timing and effect inputs. Keep exact-once checks. |
| PRO-04 and TECH-01–06 | Some variants share rosters within each recipe. | Share production setups and vary demand, queues and threats. Keep counter and affordability checks. |
| C-02–C-06 | Some variants share rosters within each recipe. | Reuse faction worlds and vary timing, scouting, pursuit or target conditions. Keep distinct behavior checks. |

## Review overlapping cases

- STRAT-02, STRAT-03 and RAID-03 all involve home defense against raids. Share setup and events where possible.
  Check whether one physical run satisfies multiple independent assertions before removing a run.
- SCOUT-02 checks stale and hidden information. C-04 checks whether scouting changes a decision. Reuse setup while
  retaining both purposes.
- WALL-02 and SEQ-06 involve fortification access. Compare route, defense and repair assertions before consolidation.
- SEQ-01 and SEQ-02 share a continuous-match recipe. Retain victory and home-raid recovery checks, and reuse a run
  only if its events and assertions satisfy both.

## Implementation boundaries

- Reuse existing world builders and registration paths. Keep variant differences, seeds, controls and expected
  effects readable and available to the scenario browser.
- Compare complete setups, events and assertions before removing duplicates. Preserve distinct faction and negative
  controls. Update manifest, browser, reports and references together.
- Existing reports are historical evidence. Changed fixtures or behavior require relevant fresh evidence. This scan
  does not establish a pass or identify any case as safe to delete.
- Start with SCOUT-02 and WALL-02, measure the reduction, then repeat where it simplifies the files.
