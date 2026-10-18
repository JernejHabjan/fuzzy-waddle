import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import ts from "typescript";

const limit = 300;
const roots = [
  "libs/games/trump-defense",
  "apps/portal/src/app/app.routes.ts",
  "apps/portal/src/app/home/page/home-page.component.ts",
  "apps/portal/src/app/home/page/home-page.component.spec.ts"
];
const ignored = new Set([
  ts.SyntaxKind.WhitespaceTrivia,
  ts.SyntaxKind.NewLineTrivia,
  ts.SyntaxKind.SingleLineCommentTrivia,
  ts.SyntaxKind.MultiLineCommentTrivia,
  ts.SyntaxKind.ShebangTrivia,
  ts.SyntaxKind.ConflictMarkerTrivia
]);

async function files(path) {
  if (path.endsWith(".ts")) return [path];
  const entries = await readdir(path, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) =>
      entry.isDirectory() ? files(join(path, entry.name)) : entry.name.endsWith(".ts") ? [join(path, entry.name)] : []
    )
  );
  return nested.flat();
}

function codeLines(path, source) {
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, source);
  const lines = new Set();
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
    if (ignored.has(token)) continue;
    const first = file.getLineAndCharacterOfPosition(scanner.getTokenPos()).line;
    const last = file.getLineAndCharacterOfPosition(Math.max(scanner.getTokenPos(), scanner.getTextPos() - 1)).line;
    for (let line = first; line <= last; line++) lines.add(line);
  }
  return lines.size;
}

let failed = false;
for (const path of (await Promise.all(roots.map(files))).flat()) {
  if (!path.endsWith(".ts")) continue;
  const count = codeLines(path, await readFile(path, "utf8"));
  if (count > limit) {
    console.error(`${path}: ${count} code lines (limit ${limit})`);
    failed = true;
  }
}
if (failed) process.exitCode = 1;
