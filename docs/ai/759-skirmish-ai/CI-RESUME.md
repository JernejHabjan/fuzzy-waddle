# AI regression CI

Updated 2026-10-31. Current progress and acceptance are in [HANDOFF.md](HANDOFF.md),
[REMAINING-WORK.md](REMAINING-WORK.md) and [CURRENT-EVIDENCE.md](CURRENT-EVIDENCE.md).

- `pnpm ai:regression -- --list` previews the seven selected variants and explicit omissions.
- `pnpm ai:regression` runs the bounded single-player pack; each result includes source/fixture identity and artifact path.
- `RUN_AI_REGRESSION=true pnpm e2e` runs ordinary E2E first, then the extended pack. Unset/false runs ordinary E2E only.
- PR/develop runtime packs require repository variable `RUN_AI_REGRESSION=true`; manual dispatch uses the workflow checkbox.
  Defaults are off. PR draft state is unchanged.
- Existing multiplayer peer CI remains a separate job and is not certified by this single-player pack.
- Before default-branch registration, explicitly push an `ai-regression/<unique-run-name>` tag at the desired commit to run the same pack. Ordinary branch pushes do not trigger it.
- Native jobs hydrate LFS assets; compile-only pointer allowances are insufficient for runtime tests.
- Remote run 41249184852 passed all seven core cases on d6ddd363a. SCOUT-02 integration remains outside the current core selection.
