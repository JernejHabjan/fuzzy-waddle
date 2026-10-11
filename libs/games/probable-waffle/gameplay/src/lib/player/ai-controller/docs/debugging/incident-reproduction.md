# Incident capture and reproduction

## Capture contract

A reproducible incident records schema/config version, candidate SHA, dirty-source digest, fixture/seed, permitted observation, previous brain state, committed outcomes, scheduler/RNG state and bounded debug context. It must not include hidden opponent state beyond the observation policy.

Captures have size/history quotas and explicit truncation status. Malformed, oversized, version-mismatched, traversal-like and unsafe display payloads are rejected or escaped. A truncated bundle cannot claim exact reproduction.

## Offline workflow

1. Select the first independently observed failure, not the loudest later symptom.
2. Export the incident and verify its provenance.
3. Replay to a decision/tick breakpoint without mutating a live match.
4. Compare ordered decisions and canonical state; report the first normalized differing path.
5. Apply an isolated what-if only to a copy of state/RNG.
6. Repair the earliest causal disagreement.
7. Rerun focused unit coverage, the affected real runtime group and the independent semantic oracle.

For large runtime artifacts, use:

```bash
pnpm ai:skirmish:report -- --failures-only --details
```

Do not dump complete artifacts unless the compact report omits a field needed to establish the cause.
