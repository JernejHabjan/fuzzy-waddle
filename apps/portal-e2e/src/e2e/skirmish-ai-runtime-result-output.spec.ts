import { expect, test } from "@playwright/test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { publishRuntimeResult } from "./skirmish-ai-runtime-result-output";

test("publishes the complete failed report in an artifact with only its location in the log", () => {
  const directory = mkdtempSync(join(tmpdir(), "runtime-output-"));
  const path = join(directory, "runtime.json");
  const report = { schemaVersion: 1, status: "failed", raw: "native facts", decisions: 16 } as const;
  const logs: string[] = [];
  const original = console.log;
  console.log = (value: unknown) => {
    logs.push(String(value));
  };
  try {
    publishRuntimeResult(report, path);
    expect(JSON.parse(readFileSync(path, "utf8"))).toEqual(report);
    expect(logs).toEqual([`AI_SKIRMISH_RUNTIME_RESULT_ARTIFACT_V1:${path}`]);
  } finally {
    console.log = original;
    rmSync(directory, { recursive: true, force: true });
  }
});

test("direct callers retain the legacy result prefix", () => {
  const logs: string[] = [];
  const original = console.log;
  console.log = (value: unknown) => {
    logs.push(String(value));
  };
  try {
    publishRuntimeResult({ schemaVersion: 1 });
    expect(logs).toEqual(['AI_SKIRMISH_RUNTIME_RESULT_V1:{"schemaVersion":1}']);
  } finally {
    console.log = original;
  }
});
