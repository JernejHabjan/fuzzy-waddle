import { writeFileSync } from "node:fs";

/** Keeps raw runtime evidence out of subprocess logs. Direct invocations retain the legacy console protocol. */
export function publishRuntimeResult(report: { readonly schemaVersion: 1 }, artifactPath?: string): void {
  const encoded = JSON.stringify(report);
  if (artifactPath) {
    writeFileSync(artifactPath, encoded);
    console.log(`AI_SKIRMISH_RUNTIME_RESULT_ARTIFACT_V1:${artifactPath}`);
  } else {
    console.log(`AI_SKIRMISH_RUNTIME_RESULT_V1:${encoded}`);
  }
}
