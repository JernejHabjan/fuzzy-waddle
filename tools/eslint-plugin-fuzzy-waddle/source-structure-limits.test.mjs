import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";
import { Linter } from "eslint";

const require = createRequire(import.meta.url);
const plugin = require("./index.cjs");

function verify(source, filename = "virtual/new-source.mjs") {
  const linter = new Linter({ configType: "flat" });
  return linter.verify(
    source,
    [
      {
        files: ["**/*.{js,mjs}"],
        languageOptions: { ecmaVersion: "latest", sourceType: "module" },
        plugins: { "fuzzy-waddle": plugin },
        rules: { "fuzzy-waddle/source-structure-limits": "error" }
      }
    ],
    { filename }
  );
}

test("accepts a small responsibility-focused source file", () => {
  assert.deepEqual(verify("export function answer() {\n  return 42;\n}\n"), []);
});

test("rejects source, function, line-width, and declaration limit violations", () => {
  const longSource = Array.from({ length: 401 }, (_, index) => `const value${index} = ${index};`).join("\n");
  assert.match(verify(longSource)[0]?.message ?? "", /maximum is 400/u);

  const longFunction = `function oversized() {\n${"  consume();\n".repeat(201)}}`;
  assert.match(verify(longFunction)[0]?.message ?? "", /maximum is 200/u);

  const longLine = `const value = "${"x".repeat(150)}";`;
  assert.match(verify(longLine)[0]?.message ?? "", /maximum is 140/u);

  const declarations = verify("class First {}\nclass Second {}\n");
  assert.match(declarations[0]?.message ?? "", /one substantive top-level/u);
});

test("excludes comment-only lines from source and function limits", () => {
  const comments = Array.from({ length: 450 }, () => "// explanation").join("\n");
  assert.deepEqual(verify(`${comments}\nexport function answer() {\n  return 42;\n}\n`), []);
});
