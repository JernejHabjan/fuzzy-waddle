import assert from "node:assert/strict";
import test from "node:test";
import { parseArguments } from "./run-agent-process.mjs";

test("parses only adapter-declared lifecycle actions", () => {
  assert.deepEqual(parseArguments(["--", "--adapter", "skirmish-ai", "--action", "status"]), {
    adapter: "skirmish-ai",
    action: "status"
  });
  assert.throws(() => parseArguments(["--adapter", "skirmish-ai"]), /missing_process_options/u);
});
