import baseConfig from "../../eslint.config.mjs";
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
      "@angular-eslint/prefer-standalone": "error"
    }
  },
  ...nx.configs["flat/angular-template"]
];
