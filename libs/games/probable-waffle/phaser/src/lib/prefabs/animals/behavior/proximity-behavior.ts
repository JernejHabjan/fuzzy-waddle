import { State } from "mistreevous";

/** Reusable behavior-tree action: fail when no target exists, otherwise pass it to the reaction. */
export function reactToNearby<T>(find: () => T | undefined, react: (target: T) => void): State {
  const target = find();
  if (!target) return State.FAILED;
  react(target);
  return State.SUCCEEDED;
}
