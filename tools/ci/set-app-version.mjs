import fs from 'node:fs';
import path from 'node:path';

const version = process.argv[2]?.trim();

if (!version) {
  console.error('Usage: node tools/ci/set-app-version.mjs <version>');
  process.exit(1);
}

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`Invalid semver version: ${version}`);
  process.exit(1);
}

const workspaceRoot = process.cwd();

const packageJsonPath = path.join(workspaceRoot, 'package.json');
const cargoTomlPath = path.join(workspaceRoot, 'apps', 'client', 'src-tauri', 'Cargo.toml');
const tauriConfigPath = path.join(workspaceRoot, 'apps', 'client', 'src-tauri', 'tauri.conf.json');

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
packageJson.version = version;
fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

const cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
const nextCargoToml = cargoToml.replace(
  /^version = ".*"$/m,
  `version = "${version}"`,
);

if (cargoToml === nextCargoToml) {
  console.error('Failed to update version in apps/client/src-tauri/Cargo.toml');
  process.exit(1);
}

fs.writeFileSync(cargoTomlPath, nextCargoToml);

const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));
tauriConfig.version = version;
fs.writeFileSync(tauriConfigPath, `${JSON.stringify(tauriConfig, null, 2)}\n`);
