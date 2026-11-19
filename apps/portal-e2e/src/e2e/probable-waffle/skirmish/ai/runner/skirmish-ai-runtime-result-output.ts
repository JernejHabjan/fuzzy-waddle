import { writeFileSync } from "node:fs";
import { encodeRuntimeArtifact } from "@fuzzy-waddle/probable-waffle-skirmish-ai-tools/shared/transport/skirmish-ai-runtime-artifact-codec";

/** Keeps raw runtime evidence out of subprocess logs. Direct invocations retain the legacy console protocol. */
export function publishRuntimeResult(report: { readonly schemaVersion: 1 }, artifactPath?: string): void {
  if (artifactPath) {
    writeFileSync(artifactPath, JSON.stringify(encodeRuntimeArtifact(report, artifactPath)));
    console.log(`AI_SKIRMISH_RUNTIME_RESULT_ARTIFACT:${artifactPath}`);
  } else {
    console.log(`AI_SKIRMISH_RUNTIME_RESULT:${JSON.stringify(report)}`);
  }
}
