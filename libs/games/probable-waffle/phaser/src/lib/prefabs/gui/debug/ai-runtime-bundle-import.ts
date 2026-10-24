import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { environment } from "@fuzzy-waddle/environments/environment";
import { parseAiRuntimeArtifact } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/debug/parse-ai-runtime-artifact";
import { AiReproBundleValidationError } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/debug/parse-ai-repro-bundle";

/** Explicit localhost developer surface. Imported content is inert data and is never applied to the running match. */
export function mountAiRuntimeBundleImport(scene: ProbableWaffleScene): void {
  if (environment.production || typeof window === "undefined" || !["localhost", "127.0.0.1"].includes(location.hostname)) return;
  try { if (sessionStorage.getItem("fuzzy-waddle:ai-runtime-import-v1") !== "1") return; }
  catch { return; }
  const root = document.createElement("details");
  root.dataset.aiRuntimeBundleImport = "1";
  Object.assign(root.style, { position: "fixed", bottom: "8px", right: "8px", zIndex: "10000",
    background: "#111827", color: "white", padding: "8px", maxWidth: "360px" });
  const heading = document.createElement("summary");
  heading.textContent = "AI runtime bundle import";
  const input = document.createElement("textarea");
  input.setAttribute("aria-label", "AI runtime bundle JSON");
  input.maxLength = 16 * 1024 * 1024 + 1;
  const button = document.createElement("button");
  button.textContent = "Import runtime bundle";
  const status = document.createElement("output");
  status.setAttribute("role", "status");
  const onImport = () => {
    try {
      const imported = parseAiRuntimeArtifact(input.value, scene.isHost ? "host" : "player");
      status.textContent = `Imported ${imported.manifest.display.label}. Replay has not run.`;
      status.dataset.result = "imported";
    } catch (error) {
      const code = error instanceof AiReproBundleValidationError ? error.code : "malformed_bundle";
      status.textContent = `Import refused: ${code}`;
      status.dataset.result = code;
    }
  };
  button.addEventListener("click", onImport);
  root.append(heading, input, button, status);
  document.body.append(root);
  const cleanup = () => {
    button.removeEventListener("click", onImport);
    root.remove();
    scene.events.off("shutdown", cleanup);
    scene.events.off("destroy", cleanup);
  };
  scene.events.once("shutdown", cleanup);
  scene.events.once("destroy", cleanup);
}
