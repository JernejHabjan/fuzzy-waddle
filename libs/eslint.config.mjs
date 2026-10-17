import baseConfig from "../eslint.config.mjs";
import angular from "angular-eslint";
import nx from "@nx/eslint-plugin";

export default [
  ...baseConfig,
  {
    ignores: ["**/metadata/**"]
  },
  ...nx.configs["flat/typescript"],
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unsafe-declaration-merging": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/triple-slash-reference": "off",
      // Newly surfaced by the flat preset; the workspace had not configured this rule before migration.
      "prefer-const": "off",
      "no-case-declarations": "off"
    }
  },
  ...angular.configs.templateRecommended.map((config) => ({
    ...config,
    files: ["**/*.html"]
  })),
  {
    files: ["**/*.html"],
    rules: {
      "@angular-eslint/template/prefer-self-closing-tags": "error"
    }
  }
];
