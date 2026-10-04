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
      // Angular's v22 migration deliberately uses Eager change detection to preserve the prior default.
      "@angular-eslint/prefer-on-push-component-change-detection": "off",
      "@angular-eslint/prefer-standalone": "error"
    }
  },
  ...angular.configs.templateRecommended.map((config) => ({
    ...config,
    files: ["**/*.html"]
  }))
];
