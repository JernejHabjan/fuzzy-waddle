import { writeFileSync } from "node:fs";
import { encodeRuntimeArtifact } from "./skirmish-ai-runtime-artifact-codec.mjs";

/** Keeps raw runtime evidence out of subprocess logs. Direct invocations retain the legacy console protocol. */
export function publishRuntimeResult(report: { readonly schemaVersion: 1 }, artifactPath?: string): void {
  if (artifactPath) {
    writeFileSync(artifactPath, JSON.stringify(encodeRuntimeArtifact(report)));
    console.log(`AI_SKIRMISH_RUNTIME_RESULT_ARTIFACT_V1:${artifactPath}`);
  } else {
    console.log(`AI_SKIRMISH_RUNTIME_RESULT_V1:${JSON.stringify(report)}`);
  }
}
