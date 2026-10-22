import { test as it, expect } from "@playwright/test";
import { EventEmitter } from "node:events";
import type { Page } from "@playwright/test";
import { installRuntimeErrorListeners } from "./skirmish-ai-runtime-error-listeners";

it("replaces only the previous native match's collector on a retained page", () => {
  const emitter = new EventEmitter(), page = emitter as unknown as Page;
  let unrelatedCalls = 0;
  const unrelated = () => { unrelatedCalls++; }, first: string[] = [], second: string[] = [];
  emitter.on("pageerror", unrelated);
  installRuntimeErrorListeners(page, first);
  emitter.emit("pageerror", new Error("AI original"));
  installRuntimeErrorListeners(page, second);
  emitter.emit("pageerror", new Error("AI next"));
  expect(first).toEqual(["AI original"]);
  expect(second).toEqual(["AI next"]);
  expect(unrelatedCalls).toBe(2);
  expect(emitter.listenerCount("pageerror")).toBe(2);
});
