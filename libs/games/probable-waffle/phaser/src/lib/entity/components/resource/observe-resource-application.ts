import { PlayerResourceObservation, type ProbableWafflePlayer, type PlayerStateResources } from
  "@fuzzy-waddle/probable-waffle-protocol";

/** Exact synchronous payload-reference/recipient join. Identical amounts, partial writes and nested calls cannot qualify. */
export function observeResourceApplication(player: ProbableWafflePlayer | undefined,
  request: Partial<PlayerStateResources>): () => object | undefined {
  if (!player) return () => undefined;
  let operation: object | undefined, begins = 0, terminals = 0, invalid = false;
  const unsubscribe = PlayerResourceObservation.subscribe(player, (event) => {
    if (event.kind !== "add" || event.request !== request || !event.bindingValid) { invalid = true; return; }
    if (event.phase === "before") {
      begins++;
      if (operation) invalid = true;
      operation = event.operation;
    } else {
      terminals++;
      if (event.phase !== "returned" || event.operation !== operation) invalid = true;
    }
  }, () => { invalid = true; });
  return () => {
    unsubscribe();
    return !invalid && begins === 1 && terminals === 1 ? operation : undefined;
  };
}
