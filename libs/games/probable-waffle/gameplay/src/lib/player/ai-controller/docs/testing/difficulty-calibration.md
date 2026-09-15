# Difficulty calibration

Correctness and challenge are separate gates. Every difficulty must obey the same rules, information boundary and essential recovery invariants before outcome calibration begins.

## Paired design

- Compare profiles using identical maps, factions, sides, rules, opponent probes and shared seeds.
- Begin with 20 paired seeds per comparison and expand to at most 100 when intervals overlap materially.
- Keep candidate and pinned baseline in isolated clean checkouts; candidate code may not silently serve as its own baseline adapter.
- Report sample size, win/outcome distribution and uncertainty rather than one headline win rate.
- Treat statistically indistinguishable advertised levels as unfinished tuning.

## Behavioral measurements

- first useful income and production;
- supply-block and producer-idle ticks;
- decision/reaction and composition-change latency;
- voluntary mission concurrency and attack timing;
- retreat/regroup/recovery time;
- unresolved command age and mission churn;
- objective effects, losses and terminal outcomes.

Difficulty may adjust cadence, voluntary breadth, risk and commitment budgets. It may not use hidden current state, unadvertised resources, stat bonuses or broken behavior on Easy.

Automated calibration does not replace human challenge/fairness playtesting. Record human review separately and never fabricate it when unavailable.
