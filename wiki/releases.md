# Releases

This project releases from the version in the root `package.json`.

## Bump The Version

Before merging a PR into `main`, bump and sync the app version:

```bash
pnpm run version:app 1.2.3
```

This updates:

- `package.json`
- `apps/client/src-tauri/Cargo.toml`
- `apps/client/src-tauri/tauri.conf.json`

Do not edit only one of those files manually. CI expects them to stay in sync.

## PR Rules For `main`

PRs targeting `main` must:

- change `package.json` version compared with `origin/main`
- keep Tauri version files in sync with `package.json`

If either condition is not met, the PR checks fail.

## What Happens After Merge To `main`

After a PR with a new version is merged into `main`:

- Render deploys from `main`
- GitHub Actions builds and deploys the GitHub Pages mirror
- GitHub Actions verifies version sync again
- GitHub Actions creates tag `vX.Y.Z`
- GitHub Actions creates a GitHub release
- GitHub Actions builds the Tauri NSIS installer
- GitHub Actions uploads the installer to the GitHub release

The `main` release workflow does not modify version files or commit back to the repository. The merged commit must already contain the final version.

## Source Of Truth

- Web app version comes from root `package.json`
- Desktop release version is synced from the same root version
- Release tag format is `vX.Y.Z`
