import baseConfig from "../../eslint.config.mjs";
import angular from "angular-eslint";
import nx from "@nx/eslint-plugin";

export default [
  ...baseConfig,
  ...nx.configs["flat/angular"],
  {
    files: ["**/*.ts"],
    rules: {
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "fuzzyWaddle",
          style: "camelCase"
        }
      ],
      "@angular-eslint/component-selector": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unsafe-declaration-merging": "off",
      "@typescript-eslint/triple-slash-reference": "off",
      "no-case-declarations": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@angular-eslint/prefer-standalone": "error",
      // Angular's v22 migration deliberately uses Eager change detection to preserve the prior default.
      "@angular-eslint/prefer-on-push-component-change-detection": "off",
      "@typescript-eslint/no-empty-object-type": "off"
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
