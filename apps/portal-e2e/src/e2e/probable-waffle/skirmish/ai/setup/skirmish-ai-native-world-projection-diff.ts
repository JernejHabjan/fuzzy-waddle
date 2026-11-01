/** Bounded canonical differences; full native objects never enter a test report. */
export interface NativeDebugProjectionDifference {
  readonly path: string;
  readonly before: string;
  readonly after: string;
}

export function nativeDebugProjectionDifferences(left: unknown, right: unknown, limit = 12): NativeDebugProjectionDifference[] {
  const differences: NativeDebugProjectionDifference[] = [];
  const add = (path: string, before: unknown, after: unknown) => {
    if (differences.length >= limit) return;
    const summarize = (value: unknown) => {
      const text = typeof value === "string" ? value : JSON.stringify(value);
      return text.length <= 180 ? text : `${text.slice(0, 90)}…(${text.length} chars)…${text.slice(-60)}`;
    };
    differences.push({ path, before: summarize(before), after: summarize(after) });
  };
  const visit = (a: unknown, b: unknown, path: string) => {
    if (differences.length >= limit || Object.is(a, b)) return;
    if (a && b && typeof a === "object" && typeof b === "object") {
      if (path === "$world.actors" && Array.isArray(a) && Array.isArray(b) &&
          [...a, ...b].every((actor) => !!actor && typeof actor === "object" && "actorId" in actor)) {
        const byActorId = (actors: readonly unknown[]) => Object.fromEntries(actors.map((entry) => {
          const actor = entry as { actorId: string };
          return [actor.actorId, actor];
        }));
        visit(byActorId(a), byActorId(b), path);
        return;
      }
      if (Array.isArray(a) || Array.isArray(b)) {
        if (!Array.isArray(a) || !Array.isArray(b)) { add(path, a, b); return; }
        if (a.length !== b.length) add(`${path}.length`, a.length, b.length);
        for (let index = 0; index < Math.min(a.length, b.length) && differences.length < limit; index++)
          visit(a[index], b[index], `${path}[${index}]`);
        return;
      }
      const leftRecord = a as Record<string, unknown>, rightRecord = b as Record<string, unknown>;
      const keys = [...new Set([...Object.keys(leftRecord), ...Object.keys(rightRecord)])].sort();
      for (const key of keys) {
        if (!(key in leftRecord) || !(key in rightRecord)) add(`${path}.${key}`, leftRecord[key], rightRecord[key]);
        else visit(leftRecord[key], rightRecord[key], `${path}.${key}`);
        if (differences.length >= limit) break;
      }
      return;
    }
    if (typeof a === "string" && typeof b === "string" && path.endsWith(".digest") && path.startsWith("$world.actors.")) {
      const fields = ["actorId", "name", "health", "armor", "x", "y", "z", "owner", "queue", "economy", "combat", "order", "scenario"];
      const before = a.split(":").map((value, index) => [fields[index] ?? String(index), value]);
      const after = b.split(":").map((value, index) => [fields[index] ?? String(index), value]);
      for (let index = 0; index < Math.max(before.length, after.length) && differences.length < limit; index++) {
        if (before[index]?.[1] !== after[index]?.[1])
          add(`${path}.${before[index]?.[0] ?? after[index]?.[0]}`, before[index]?.[1], after[index]?.[1]);
      }
      return;
    }
    if (typeof a === "string" && typeof b === "string" && path === "$world.systems.aiControllers") {
      let index = 0;
      while (index < Math.min(a.length, b.length) && a[index] === b[index]) index++;
      add(`${path}@${index}`, a.slice(Math.max(0, index - 70), index + 110), b.slice(Math.max(0, index - 70), index + 110));
      return;
    }
    add(path, a, b);
  };
  visit(left, right, "$world");
  return differences;
}

export function nativeDebugProjectionDifferencePaths(left: unknown, right: unknown, limit = 12): string[] {
  return nativeDebugProjectionDifferences(left, right, limit).map(({ path }) => path);
}
