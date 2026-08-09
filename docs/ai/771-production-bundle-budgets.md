# Production bundle budget decision

Closes #771.

## Observed baseline

The production CI run for PR #768 built the current `develop` source and reported:

| Application               | Initial bundle | Current error budget |
| ------------------------- | -------------: | -------------------: |
| `portal`                  |        4.10 MB |              2.00 MB |
| `probable-waffle-desktop` |        4.07 MB |              2.00 MB |

Both applications retain a 1.50 MB warning threshold. The failure is independent of the dependency-only change in #768.

## Decision required

Choose one policy before changing `apps/portal/project.json` or `apps/probable-waffle-desktop/project.json`:

1. **Accept recommendation — restore a meaningful guardrail now.** Set each initial error threshold to the measured baseline plus a small headroom (recommended: 4.5 MB), keep the warning threshold below it (recommended: 4.0 MB), and open follow-up performance issues for the largest initial chunks.
2. **Use: <performance target>.** Keep the 2.0 MB hard limit and fund a focused lazy-loading/dependency-reduction project before merging CI-dependent work.
3. **Defer.** Keep the builds red and do not merge PRs whose affected build includes either application.

Recommendation rationale: the current limits no longer distinguish a regression from the established baseline, so CI cannot serve its intended gate. The recommendation preserves an explicit ceiling and makes subsequent bundle growth visible, while avoiding a speculative refactor.

## Follow-up measurement plan

After selecting a policy, the implementation PR will:

1. Rebuild both applications with production settings and record initial and lazy chunk sizes.
2. Change only the approved budget policy or the approved loading boundary.
3. Run `pnpm nx affected -t build --configuration=production` and confirm both applications have an intentional result.
4. File one performance issue per independently removable initial dependency or feature boundary; do not fold bundle optimization into unrelated gameplay work.

## Continuation prompt

```text
Continue PR #<implementation-pr> for #771. The selected policy is: <paste option 1, 2, or 3 response>. Apply only that policy, measure portal and probable-waffle-desktop production bundles, run the affected production build, and open separate follow-ups for any optimization work. Do not change unrelated gameplay, API, or dependency behavior.
```
