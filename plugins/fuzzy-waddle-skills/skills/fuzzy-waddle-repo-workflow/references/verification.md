# Focused verification routes

Read only when selecting or running checks. The task/lane supplies authority and required scope; this reference is not blanket approval.

## Discover real targets

Read package.json (Node/pnpm/Phaser versions), the owning project.json and Jest/TypeScript config before invoking a target. Use existing dependencies; do not replace lockfiles or install unrelated tools. Current explicit targets:

| Project | Definition | Available relevant targets |
| --- | --- | --- |
| probable-waffle-phaser | libs/games/probable-waffle/phaser/project.json | lint, test |
| probable-waffle-server | libs/games/probable-waffle/server/project.json | lint, test |
| probable-waffle-gameplay | libs/games/probable-waffle/gameplay/project.json | lint; no test target yet |
| probable-waffle-protocol | libs/games/probable-waffle/protocol/project.json | lint; no test target yet |

This snapshot is not an excuse to omit needed tests. #759 Stage 2 supplies missing pure/protocol targets. Discover other project targets locally; do not assume every library has test/build.

- Focus a supported Jest target with pnpm exec nx test followed by the owning project and its supported test filter. Verify the filter selected the intended spec and a nonzero test count.
- This checkout uses legacy .eslintrc.json and project-scoped Nx lint. A bare ESLint 9 invocation expects flat config and is not the equivalent route; root ignore rules and extensions may exclude standalone .mjs tools. Use the owning target, or explicitly scoped syntax/rule checks for a tool with no target, and label that narrower coverage. Do not migrate repository lint configuration for an unrelated task.
- Type-check actual source through the owning TypeScript config; a passing empty/include-excluded target proves nothing.
- Use tools/testing/jest-node-preset.cjs or tools/testing/jest-angular-preset.cjs where appropriate; keep production imports and real consumer contracts represented.
- Editor wiring: package script phaser-editor:check. Assets/LFS: assets:check. Broad production builds are not a substitute for focused regressions.
- Read full errors, fix task-caused failures and rerun affected checks. Record unrelated failures with evidence; unavailable required infrastructure remains blocked.

## Documentation/skill changes

- git diff --check plus scoped link/path checks catch missing resources; inspect git diff --cached before publication.
- Requested docs may be ignored by Git/Prettier. Use git check-ignore to diagnose; force-add only exact authorized files. For explicitly selected hand-authored files, Prettier --ignore-path /dev/null avoids an ignored-file “pass.” Never apply that override to whole asset/generated trees.
- The bundled skill-creator quick_validate.py checks skill schema/names/scaffolds when available. The repo's tools/skills/check-index.mjs checks local skill links, indexed paths and project targets without running the game.
- Validate workflows by tracing realistic success and failure cases, not just matching prose. Check failed tests, rejected pushes, already-completed prerequisites, unavailable models and interrupted resumes.

Verification evidence must include command, source revision/diff digest, selected tests/fixture versions and outcome. An overview-page smoke is documentation evidence, not gameplay or difficulty calibration.
