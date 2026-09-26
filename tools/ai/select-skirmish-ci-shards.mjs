#!/usr/bin/env node
import { appendFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { planSkirmishRuntimeShards } from "./skirmish-ci-shards.mjs";

const directory = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const manifest = JSON.parse(readFileSync(join(directory, "skirmish-v1.json"), "utf8"));
const plan = planSkirmishRuntimeShards(
  manifest,
  (reference) => JSON.parse(readFileSync(join(directory, reference), "utf8"))
);
const matrix = JSON.stringify({ include: plan.shards });
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `matrix=${matrix}\n`);
process.stdout.write(`${JSON.stringify({ matrix: JSON.parse(matrix), deferred: plan.deferred })}\n`);
