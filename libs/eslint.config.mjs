import baseConfig from "../eslint.config.mjs";
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
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unsafe-declaration-merging": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/triple-slash-reference": "off",
      "no-case-declarations": "off"
    }
  },
  ...nx.configs["flat/angular-template"],
  {
    files: ["**/*.html"],
    rules: {
      "@angular-eslint/template/prefer-self-closing-tags": "error"
    }
  }
];
