import { validAiRuntimePresetProvenance } from "./validate-ai-runtime-preset-provenance";

const provenance = { sourceRevision: "a".repeat(40), fixtureDigest: "fnv1a32:12345678" };
it("admits the native revision and fixture digest contract", () => {
  expect(validAiRuntimePresetProvenance(provenance)).toBe(true);
});
it.each([
  { ...provenance, fixtureDigest: `sha256:${"b".repeat(64)}` },
  { ...provenance, sourceRevision: "working-tree" },
  { ...provenance, fixtureDigest: "fnv1a32:123" },
  { ...provenance, extra: true },
  null
])("rejects profiling inputs that would silently disable the native harness: %p", (value) => {
  expect(validAiRuntimePresetProvenance(value)).toBe(false);
});
