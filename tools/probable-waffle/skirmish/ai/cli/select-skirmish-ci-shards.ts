#!/usr/bin/env node
import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { planSkirmishRuntimeShards } from "../matrix/skirmish-ci-shards.ts";

const directory = fileURLToPath(new URL("../testing/fixtures/", import.meta.url));
const manifest = JSON.parse(readFileSync(join(directory, "skirmish-scenario-manifest.json"), "utf8"));
const plan = planSkirmishRuntimeShards(manifest, (reference) =>
  JSON.parse(readFileSync(join(directory, reference), "utf8"))
);
const matrix = JSON.stringify({ include: plan.shards });
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `matrix=${matrix}\n`);
process.stdout.write(`${JSON.stringify({ matrix: JSON.parse(matrix), deferred: plan.deferred })}\n`);
