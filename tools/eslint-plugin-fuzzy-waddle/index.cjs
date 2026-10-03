"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const sourceStructureBaseline = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "tools/eslint-plugin-fuzzy-waddle/source-structure-baseline.json"), "utf8")
);

const sourceDeclarationTypes = new Set([
  "ClassDeclaration",
  "TSInterfaceDeclaration",
  "TSTypeAliasDeclaration",
  "TSEnumDeclaration"
]);

function maskComments(sourceCode) {
  const characters = [...sourceCode.text];
  for (const comment of sourceCode.getAllComments()) {
    for (let index = comment.range[0]; index < comment.range[1]; index += 1) {
      if (characters[index] !== "\n" && characters[index] !== "\r") characters[index] = " ";
    }
  }
  return characters.join("");
}

function countNonCommentLines(maskedSource, range) {
  return maskedSource
    .slice(range[0], range[1])
    .split(/\r?\n/u)
    .filter((line) => line.trim().length > 0).length;
}

function sourcePath(filename) {
  return path.relative(process.cwd(), filename).split(path.sep).join("/");
}

function isBaselined(filename, sourceText) {
  const relativePath = sourcePath(filename);
  const expectedDigest = sourceStructureBaseline[relativePath];
  if (!expectedDigest) return false;
  return crypto.createHash("sha256").update(sourceText).digest("hex") === expectedDigest;
}

function isGeneratedOrDeclarationFile(filename) {
  const normalized = filename.split(path.sep).join("/");
  return (
    normalized.endsWith(".d.ts") ||
    normalized.includes("/generated/") ||
    normalized.includes("/vendor/") ||
    normalized.endsWith("/source-structure-baseline.json")
  );
}

module.exports = {
  rules: {
    "source-structure-limits": {
      meta: {
        type: "suggestion",
        docs: { description: "Enforce maintainable source size, line width, and declaration ownership" },
        schema: []
      },
      create(context) {
        const sourceCode = context.sourceCode;
        const filename = context.getFilename();
        if (filename === "<input>" || isGeneratedOrDeclarationFile(filename)) return {};
        if (isBaselined(filename, sourceCode.text)) return {};

        const maskedSource = maskComments(sourceCode);
        const functionNodes = [];

        return {
          FunctionDeclaration: (node) => functionNodes.push(node),
          FunctionExpression: (node) => functionNodes.push(node),
          ArrowFunctionExpression: (node) => functionNodes.push(node),
          "Program:exit"(program) {
            const sourceLines = countNonCommentLines(maskedSource, program.range);
            if (sourceLines > 400) {
              context.report({
                node: program,
                message: `Hand-maintained source has ${sourceLines} non-comment lines; maximum is 400.`
              });
            }

            const longLines = sourceCode.lines
              .map((line, index) => ({ index, length: line.length }))
              .filter((line) => line.length > 140);
            for (const line of longLines.slice(0, 5)) {
              context.report({
                loc: { line: line.index + 1, column: 140 },
                message: `Line is ${line.length} columns; maximum is 140.`
              });
            }
            if (longLines.length > 5) {
              context.report({
                node: program,
                message: `${longLines.length - 5} additional lines exceed 140 columns.`
              });
            }

            for (const node of functionNodes) {
              const functionLines = countNonCommentLines(maskedSource, node.range);
              if (functionLines <= 200) continue;
              context.report({
                node,
                message: `Function or method has ${functionLines} non-comment lines; maximum is 200.`
              });
            }

            const declarations = program.body
              .map((node) =>
                node.type === "ExportNamedDeclaration" || node.type === "ExportDefaultDeclaration"
                  ? node.declaration
                  : node
              )
              .filter((node) => node && sourceDeclarationTypes.has(node.type));
            if (declarations.length > 1) {
              for (const declaration of declarations.slice(1)) {
                context.report({
                  node: declaration,
                  message: "Keep one substantive top-level class, interface, type, or enum per source file."
                });
              }
            }
          }
        };
      }
    },
    "require-phaser-import": {
      meta: {
        type: "problem",
        docs: { description: "Require Phaser to be imported explicitly" },
        fixable: "code",
        schema: []
      },
      create(context) {
        let hasPhaserImport = false;

        function fixWithPhaserImport(fixer) {
          if (hasPhaserImport) {
            return null;
          }

          hasPhaserImport = true;
          return fixer.insertTextBeforeRange([0, 0], 'import Phaser from "phaser";\n');
        }

        function isImportBinding(definition) {
          return definition && definition.type === "ImportBinding" && definition.parent?.source?.value === "phaser";
        }

        return {
          ImportDeclaration(node) {
            if (node.source.value === "phaser") {
              hasPhaserImport = true;
            }
          },
          Identifier(node) {
            if (
              node.name !== "Phaser" ||
              node.parent.type === "ImportSpecifier" ||
              node.parent.type === "ImportDefaultSpecifier"
            ) {
              return;
            }

            let scope = context.sourceCode.getScope(node);
            while (scope) {
              const variable = scope.set.get("Phaser");
              if (variable) {
                if (!variable.defs.some(isImportBinding)) {
                  context.report({
                    node,
                    message: "Import Phaser explicitly from 'phaser'; do not use the global Phaser namespace.",
                    fix: fixWithPhaserImport
                  });
                }
                return;
              }
              scope = scope.upper;
            }

            context.report({
              node,
              message: "Import Phaser explicitly from 'phaser'; do not use the global Phaser namespace.",
              fix: fixWithPhaserImport
            });
          }
        };
      }
    }
  }
};
