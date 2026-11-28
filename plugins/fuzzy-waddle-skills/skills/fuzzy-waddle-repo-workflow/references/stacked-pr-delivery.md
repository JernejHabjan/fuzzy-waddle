# Stacked PR delivery

Use only when the user authorizes the relevant split, restack, push or merge. This reference grants no additional authority.

## Preserve the reviewed changes

- Snapshot each original base/head SHA and the integration tip before rewriting any branch. Check worktree ownership and unrelated changes first.
- Inspect merge commits before rebasing. Ordinary replay can omit edits that exist only in a merge result. When a replacement base has the same tree as the original base, applying the complete original base-to-head diff can preserve those edits; otherwise resolve the changed base deliberately.
- Compare replacement and original trees after a history-only rewrite. A changed commit count or clean rebase is insufficient. If the base intentionally changed, review that delta separately and reconcile every task-owned change.
- Before an authorized history rewrite is pushed, check the current remote SHA and use an explicit expected-SHA lease. Never overwrite another writer's branch.

## Publish accurate PRs

- Explain each PR's complete current scope with concrete behavior, responsibility-based sections and validation/limits. Use a table or diagram when it clarifies multiple areas; scale detail to the diff. Write actual newlines using structured tool fields or `--body-file`, then read the published body back.
- Keep dependencies and comparison bases accurate. After a predecessor is squash-merged, check the successor's diff before proceeding; tree-equivalent history may still contain the predecessor's old commits.
- Native GitHub stacks can lock ordinary retargeting or reject the synchronous merge endpoint. Inspect the reported stack state and use its supported asynchronous merge path when available; do not bypass protection or treat an accepted request as a completed merge.
- Merge in dependency order only with explicit user authority. Verify the resulting base SHA, expected diff/tree and required checks after each merge. Stop for a genuine conflict or failed required check. Do not merge the remainder merely because earlier PRs succeeded.
