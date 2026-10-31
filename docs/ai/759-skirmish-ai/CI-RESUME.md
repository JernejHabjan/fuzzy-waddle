# AI regression CI

Updated 2026-10-31. Current progress and acceptance are in [HANDOFF.md](HANDOFF.md),
[REMAINING-WORK.md](REMAINING-WORK.md) and [CURRENT-EVIDENCE.md](CURRENT-EVIDENCE.md).

- `pnpm ai:regression -- --list` previews the seven selected variants and explicit omissions.
- `pnpm ai:regression` runs the bounded single-player pack; each result includes source/fixture identity and artifact path.
- `RUN_AI_REGRESSION=true pnpm e2e` runs ordinary E2E first, then the extended pack. Unset/false runs ordinary E2E only.
- PR/develop runtime packs require repository variable `RUN_AI_REGRESSION=true`; manual dispatch uses the workflow checkbox.
  Defaults are off. PR draft state is unchanged.
- Existing multiplayer peer CI remains a separate job and is not certified by this single-player pack.
- Current workflows are authored but not dispatched. A successful local H-13 shard is recorded in CURRENT-EVIDENCE.
