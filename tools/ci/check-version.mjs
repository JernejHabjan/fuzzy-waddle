import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const mode = process.argv[2];
const workspaceRoot = process.cwd();

const packageJsonPath = path.join(workspaceRoot, 'package.json');
const cargoTomlPath = path.join(workspaceRoot, 'apps', 'client', 'src-tauri', 'Cargo.toml');
const tauriConfigPath = path.join(workspaceRoot, 'apps', 'client', 'src-tauri', 'tauri.conf.json');

function readPackageVersion() {
  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')).version;
}

function checkSync() {
  const packageVersion = readPackageVersion();
  const cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
  const cargoMatch = cargoToml.match(/^version = "(.*)"$/m);

  if (!cargoMatch) {
    console.error('Could not find package version in apps/client/src-tauri/Cargo.toml');
    process.exit(1);
  }

  const tauriVersion = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8')).version;
  const mismatches = [
    ['apps/client/src-tauri/Cargo.toml', cargoMatch[1]],
    ['apps/client/src-tauri/tauri.conf.json', tauriVersion],
  ].filter(([, version]) => version !== packageVersion);

  if (mismatches.length > 0) {
    console.error(`Version mismatch detected. package.json is ${packageVersion}.`);
    for (const [file, version] of mismatches) {
      console.error(`- ${file}: ${version}`);
    }
    process.exit(1);
  }

  console.log(`Versions are in sync at ${packageVersion}.`);
}

function checkPrBump() {
  const baseRef = process.env.GITHUB_BASE_REF;

  if (!baseRef) {
    console.error('GITHUB_BASE_REF is required for PR version checks.');
    process.exit(1);
  }

  execFileSync('git', ['fetch', 'origin', baseRef, '--depth=1'], {
    cwd: workspaceRoot,
    stdio: 'inherit',
  });

  const currentVersion = readPackageVersion();
  const basePackageJsonRaw = execFileSync('git', ['show', `origin/${baseRef}:package.json`], {
    cwd: workspaceRoot,
    encoding: 'utf8',
  });
  const baseVersion = JSON.parse(basePackageJsonRaw).version;

  if (currentVersion === baseVersion) {
    console.error(`package.json version must change for PRs into ${baseRef}. Current and base are both ${currentVersion}.`);
    process.exit(1);
  }

  console.log(`Version bump detected for ${baseRef}: ${baseVersion} -> ${currentVersion}`);
}

if (mode === 'sync') {
  checkSync();
} else if (mode === 'pr-bump') {
  checkPrBump();
} else {
  console.error('Usage: node tools/ci/check-version.mjs <sync|pr-bump>');
  process.exit(1);
}
