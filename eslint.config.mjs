import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";
import js from "@eslint/js";
import nx from "@nx/eslint-plugin";
import eslintPluginFuzzyWaddle from "eslint-plugin-fuzzy-waddle";

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
  recommendedConfig: js.configs.recommended
});

export default [
  ...nx.configs["flat/base"],
  { plugins: { "fuzzy-waddle": eslintPluginFuzzyWaddle } },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    rules: {
      "fuzzy-waddle/require-phaser-import": "error",
      "@nx/enforce-module-boundaries": [
        "error",
        {
          enforceBuildableLibDependency: true,
          banTransitiveDependencies: true,
          checkNestedExternalImports: true,
          checkDynamicDependenciesExceptions: [
            "@fuzzy-waddle/platform-identity",
            "@fuzzy-waddle/platform-identity/**",
            "@fuzzy-waddle/fly-squasher-interface",
            "@fuzzy-waddle/fly-squasher-interface/**"
          ],
          allow: [],
          depConstraints: [
            {
              sourceTag: "scope:portal",
              onlyDependOnLibsWithTags: [
                "scope:portal",
                "scope:platform",
                "scope:probable-waffle",
                "scope:little-muncher",
                "scope:fly-squasher",
                "scope:dungeon-crawler",
                "scope:trump-defense"
              ]
            },
            {
              sourceTag: "scope:api",
              onlyDependOnLibsWithTags: [
                "scope:api",
                "scope:platform",
                "scope:probable-waffle",
                "scope:little-muncher",
                "scope:fly-squasher"
              ]
            },
            {
              sourceTag: "scope:platform",
              onlyDependOnLibsWithTags: ["scope:platform"]
            },
            {
              sourceTag: "scope:probable-waffle",
              onlyDependOnLibsWithTags: ["scope:probable-waffle", "scope:platform"]
            },
            {
              sourceTag: "scope:little-muncher",
              onlyDependOnLibsWithTags: ["scope:little-muncher", "scope:platform"]
            },
            {
              sourceTag: "scope:fly-squasher",
              onlyDependOnLibsWithTags: ["scope:fly-squasher", "scope:platform"]
            },
            {
              sourceTag: "scope:dungeon-crawler",
              onlyDependOnLibsWithTags: ["scope:dungeon-crawler", "scope:platform"]
            },
            {
              sourceTag: "scope:trump-defense",
              onlyDependOnLibsWithTags: ["scope:trump-defense", "scope:platform"]
            },
            {
              sourceTag: "type:interface",
              onlyDependOnLibsWithTags: [
                "type:interface",
                "type:phaser",
                "type:gameplay",
                "type:protocol",
                "type:platform"
              ]
            },
            {
              sourceTag: "type:phaser",
              onlyDependOnLibsWithTags: ["type:phaser", "type:gameplay", "type:protocol", "type:platform"]
            },
            {
              sourceTag: "type:gameplay",
              onlyDependOnLibsWithTags: ["type:gameplay", "type:protocol", "type:platform"]
            },
            {
              sourceTag: "type:protocol",
              onlyDependOnLibsWithTags: ["type:protocol", "type:platform"]
            },
            {
              sourceTag: "type:server",
              onlyDependOnLibsWithTags: ["type:server", "type:protocol", "type:platform"]
            },
            {
              sourceTag: "type:platform",
              onlyDependOnLibsWithTags: ["type:platform"]
            }
          ]
        }
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["apps/*/src/**", "libs/*/src/**", "libs/games/*/*/src/**", "libs/platform/*/src/**"],
              message: "Import another project through its @fuzzy-waddle public alias."
            }
          ]
        }
      ]
    }
  },
  ...nx.configs["flat/typescript"],
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "no-extra-semi": "off"
    }
  },
  ...nx.configs["flat/javascript"],
  {
    files: ["**/*.js", "**/*.jsx"],
    rules: {
      "no-extra-semi": "off"
    }
  },
  ...compat
    .config({
      env: {
        jest: true
      }
    })
    .map((config) => ({
      ...config,
      files: ["**/*.spec.ts", "**/*.spec.tsx", "**/*.spec.js", "**/*.spec.jsx"],
      rules: {
        ...config.rules
      }
    }))
];
