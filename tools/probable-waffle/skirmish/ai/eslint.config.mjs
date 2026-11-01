import baseConfig from "../../../../eslint.config.mjs";

export default [...baseConfig, { files: ["**/*.ts"], rules: { "fuzzy-waddle/source-structure-limits": "error" } }];
