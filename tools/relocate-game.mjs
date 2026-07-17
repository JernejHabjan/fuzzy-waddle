import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";

const workspaceRoot = resolve(import.meta.dirname, "..");
const game = process.argv[2];

if (!game) {
  throw new Error("Pass a game directory name.");
}

const sourceRoot = join(workspaceRoot, "apps/client/src/app", game);
const targetRoot = join(workspaceRoot, "libs/games", game);

if (!existsSync(sourceRoot)) {
  throw new Error(`Game source does not exist: ${sourceRoot}`);
}

const listFiles = (root) =>
  readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    return entry.isDirectory() ? listFiles(path) : [path];
  });

const sourceFiles = listFiles(sourceRoot);
const mappings = new Map();
const groups = new Map();

for (const source of sourceFiles) {
  const gameRelative = relative(sourceRoot, source);
  const segments = gameRelative.split(sep);
  const isGameplay = segments[0] === "game";
  const withinProject = isGameplay ? segments.slice(1).join(sep) : gameRelative;
  const projectType = isGameplay ? "gameplay" : "interface";
  const target = join(targetRoot, projectType, "src/lib", withinProject);
  mappings.set(source, target);
  groups.set(source, projectType);
}

const resolveModule = (sourceFile, specifier) => {
  const base = resolve(dirname(sourceFile), specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    join(base, "index.ts"),
    join(base, "index.tsx")
  ];
  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
};

const aliasFor = (targetFile) => {
  const projectType = groups.get(targetFile);
  const projectRoot = join(targetRoot, projectType, "src/lib");
  const suffix = relative(projectRoot, mappings.get(targetFile)).split(sep).join("/").replace(/\.[^.]+$/, "");
  return `@fuzzy-waddle/${game}-${projectType}/${suffix}`;
};

const allTypeScript = [
  ...listFiles(join(workspaceRoot, "apps")).filter((path) => [".ts", ".tsx"].includes(extname(path))),
  ...listFiles(join(workspaceRoot, "libs")).filter((path) => [".ts", ".tsx"].includes(extname(path)))
];

const modulePattern = /(from\s+|import\s*\(\s*)["']([^"']+)["']/g;

for (const sourceFile of allTypeScript) {
  const original = readFileSync(sourceFile, "utf8");
  const sourceAfterMove = mappings.get(sourceFile) ?? sourceFile;
  const sourceGroup = groups.get(sourceFile);
  const updated = original.replace(modulePattern, (match, prefix, specifier) => {
    if (!specifier.startsWith(".")) return match;
    const targetFile = resolveModule(sourceFile, specifier);
    if (!targetFile || !mappings.has(targetFile)) return match;

    const targetGroup = groups.get(targetFile);
    let nextSpecifier;
    if (sourceGroup && sourceGroup === targetGroup) {
      nextSpecifier = relative(dirname(sourceAfterMove), mappings.get(targetFile)).split(sep).join("/");
      if (!nextSpecifier.startsWith(".")) nextSpecifier = `./${nextSpecifier}`;
      nextSpecifier = nextSpecifier.replace(/\.[^.]+$/, "");
    } else {
      nextSpecifier = aliasFor(targetFile);
    }
    return `${prefix}"${nextSpecifier}"`;
  });

  if (updated !== original) {
    writeFileSync(sourceFile, updated);
  }
}

mkdirSync(join(targetRoot, "gameplay/src"), { recursive: true });
mkdirSync(join(targetRoot, "interface/src/lib"), { recursive: true });

execFileSync("git", ["mv", join(sourceRoot, "game"), join(targetRoot, "gameplay/src/lib")], {
  cwd: workspaceRoot,
  stdio: "inherit"
});

const remaining = readdirSync(sourceRoot);
for (const entry of remaining) {
  execFileSync("git", ["mv", join(sourceRoot, entry), join(targetRoot, "interface/src/lib", entry)], {
    cwd: workspaceRoot,
    stdio: "inherit"
  });
}
