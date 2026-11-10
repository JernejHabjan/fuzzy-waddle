import type { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalog } from "../../contracts/observation/ai-capability-catalog";
import type { AiObservation } from "../../contracts/observation/ai-observation";
import { isFinishedActor } from "../production/macro/ai-macro-observation";
import { matchesAdaptationRole } from "./ai-adaptation-role-match";

/** Finds the shortest currently buildable chain to an anti-air product, without assuming a faction recipe. */
export function counterInfrastructurePath(
  catalog: AiCapabilityCatalog,
  self: readonly AiObservation["actors"][number][]
): readonly ObjectNames[] | undefined {
  const entries = new Map(catalog.entries.map((entry) => [entry.sourceObjectName, entry]));
  const ready = new Set(self.filter(isFinishedActor).map((actor) => actor.objectName));
  const builders = new Set(self.filter(isFinishedActor).map((actor) => actor.objectName));
  const pathFor = (name: ObjectNames, stack: ReadonlySet<ObjectNames>): ObjectNames[] | undefined => {
    if (ready.has(name)) return [];
    if (stack.has(name)) return undefined;
    const entry = entries.get(name);
    if (
      !entry?.constructionProfile ||
      !catalog.entries.some(
        (candidate) => builders.has(candidate.sourceObjectName) && candidate.constructs.includes(name)
      )
    )
      return undefined;
    const nextStack = new Set([...stack, name]);
    const path: ObjectNames[] = [];
    for (const dependency of entry.constructionProfile.requiredObjectNames ?? []) {
      const prerequisite = pathFor(dependency, nextStack);
      if (!prerequisite) return undefined;
      for (const item of prerequisite) if (!path.includes(item)) path.push(item);
    }
    if (!path.includes(name)) path.push(name);
    return path;
  };
  const paths: ObjectNames[][] = [];
  for (const producer of catalog.entries) {
    for (const name of producer.produces) {
      const product = entries.get(name);
      if (!product || !matchesAdaptationRole(product, "anti_air")) continue;
      const path: ObjectNames[] = [];
      for (const requirement of [
        producer.sourceObjectName,
        ...(product.constructionProfile?.requiredObjectNames ?? [])
      ]) {
        const dependency = pathFor(requirement, new Set());
        if (!dependency) {
          path.length = 0;
          break;
        }
        for (const item of dependency) if (!path.includes(item)) path.push(item);
      }
      // Empty also means an already available route, which suppresses needless building even when its queue is full.
      if (
        path.length ||
        (ready.has(producer.sourceObjectName) &&
          (product.constructionProfile?.requiredObjectNames ?? []).every((requirement) => ready.has(requirement)))
      ) {
        paths.push(path);
      }
    }
  }
  return paths.sort((left, right) => left.length - right.length || left.join("|").localeCompare(right.join("|")))[0];
}
