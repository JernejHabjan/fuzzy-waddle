import { EventEmitter } from "node:events";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { mountAiRuntimeBundleImport } from "./ai-runtime-bundle-import";

jest.mock("@fuzzy-waddle/environments/environment", () => ({ environment: { production: false } }));

describe("native runtime import surface", () => {
  beforeEach(() => {
    document.querySelectorAll("[data-ai-runtime-bundle-import]").forEach((element) => element.remove());
    sessionStorage.removeItem("fuzzy-waddle:ai-runtime-import-v1");
  });

  it("creates no surface without the explicit developer opt-in", () => {
    mountAiRuntimeBundleImport({} as ProbableWaffleScene);
    expect(document.querySelector("[data-ai-runtime-bundle-import]")).toBeNull();
  });

  it("checks current host authority at click time and detaches on scene shutdown", () => {
    sessionStorage.setItem("fuzzy-waddle:ai-runtime-import-v1", "1");
    const events = new EventEmitter();
    const owner = { isHost: true, events };
    mountAiRuntimeBundleImport(owner as unknown as ProbableWaffleScene);
    const root = document.querySelector("[data-ai-runtime-bundle-import]")!;
    const input = root.querySelector("textarea")!;
    input.value = "<img src=x onerror=alert(1)>";
    owner.isHost = false;
    root.querySelector("button")!.click();
    expect(root.querySelector("output")!.textContent).toBe("Import refused: access_denied");
    expect(root.querySelector("img,script")).toBeNull();
    events.emit("shutdown");
    expect(root.isConnected).toBe(false);
    expect(events.listenerCount("destroy")).toBe(0);
  });
});
