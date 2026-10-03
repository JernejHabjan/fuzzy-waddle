"use strict";

module.exports = {
  rules: {
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
            if (node.name !== "Phaser" || node.parent.type === "ImportSpecifier" || node.parent.type === "ImportDefaultSpecifier") {
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
