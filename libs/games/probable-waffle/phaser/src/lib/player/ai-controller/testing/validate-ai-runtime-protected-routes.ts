import { hasOnlyKeys, isRecord } from "./ai-runtime-fixture-values";

/** Keep geometry probes bounded and explicitly owned; declarations supply no path, placement or success verdict. */
export function validAiRuntimeProtectedRoutes(value: unknown, owners: ReadonlySet<number>): boolean {
  if (value === undefined) return true;
  if (!Array.isArray(value) || value.length < 1 || value.length > 8) return false;
  const ids = new Set<string>();
  for (const route of value) {
    if (!isRecord(route) || !hasOnlyKeys(route, ["id", "playerNumber", "from", "to", "tileMargin"])) return false;
    const id = route["id"], owner = route["playerNumber"], margin = route["tileMargin"];
    if (typeof id !== "string" || !/^[a-z0-9][a-z0-9-]{2,63}$/.test(id) || ids.has(id)) return false;
    if (typeof owner !== "number" || !owners.has(owner)) return false;
    if (!Number.isSafeInteger(margin) || typeof margin !== "number" || margin < 0 || margin > 2) return false;
    for (const point of [route["from"], route["to"]]) {
      if (!isRecord(point) || !hasOnlyKeys(point, ["x", "y"])) return false;
      if (typeof point["x"] !== "number" || !Number.isFinite(point["x"]) || Math.abs(point["x"]) > 65536) return false;
      if (typeof point["y"] !== "number" || !Number.isFinite(point["y"]) || point["y"] < 0 || point["y"] > 65536) return false;
    }
    const from = route["from"], to = route["to"];
    if (!isRecord(from) || !isRecord(to) || (from["x"] === to["x"] && from["y"] === to["y"])) return false;
    ids.add(id);
  }
  return true;
}
