import { ResourceType } from "../../probable-waffle/resource-type-definition";
import type { ProbableWafflePlayer } from "./probable-waffle-player";
import type { PlayerResourceMutation } from "./player-resource-mutation";

const listeners = new WeakMap<ProbableWafflePlayer, Set<{
  event: (event: PlayerResourceMutation) => void; loss: (reason: string) => void; state: object;
}>>();
const states = new WeakMap<object, Set<ProbableWafflePlayer>>();
const active = new WeakMap<ProbableWafflePlayer, { leaf: boolean }>();
const reportingLoss = new WeakSet<ProbableWafflePlayer>();

/** Optional protocol-local observation. It neither owns money nor makes public mutable aliases observable. */
export class PlayerResourceObservation {
  static subscribe(player: ProbableWafflePlayer, event: (event: PlayerResourceMutation) => void,
    loss: (reason: string) => void): () => void {
    const group = listeners.get(player) ?? new Set();
    if (group.size >= 8) { safely(() => loss("recipient_listener_overflow")); return () => undefined; }
    const bound = player.playerState;
    const owners = states.get(bound) ?? new Set();
    if (!owners.has(player) && owners.size >= 256) { safely(() => loss("recipient_state_binding_overflow")); return () => undefined; }
    const entry = { event, loss, state: bound };
    group.add(entry);
    listeners.set(player, group);
    owners.add(player);
    states.set(bound, owners);
    return () => {
      group.delete(entry);
      if (![...group].some((other) => other.state === bound)) owners.delete(player);
      if (!group.size) listeners.delete(player);
    };
  }

  /** Called before reset's first write; constructor resets have no subscribers. */
  static reset(state: object): void {
    [...(states.get(state) ?? [])].forEach((player) => this.lose(player, "recipient_state_reset"));
  }

  static lose(player: ProbableWafflePlayer, reason: string): void {
    if (reportingLoss.has(player)) return;
    reportingLoss.add(player);
    try { [...(listeners.get(player) ?? [])].forEach((entry) => safely(() => entry.loss(reason))); }
    finally { reportingLoss.delete(player); }
  }

  /** One explicit expected vector-to-leaf call. Consume the permit at entry so deeper reentrancy cannot inherit it. */
  static leaf(player: ProbableWafflePlayer, native: () => void): void {
    const scope = active.get(player);
    if (!scope) { native(); return; }
    scope.leaf = true;
    try { native(); } finally { scope.leaf = false; }
  }

  /** Native work runs once; readers/listeners cannot replace its return or original thrown error. */
  static run(player: ProbableWafflePlayer, kind: "add" | "pay", request: Partial<Record<ResourceType, number>>,
    native: () => void, leaf = false): void {
    const group = listeners.get(player);
    if (!group?.size) { native(); return; }
    const parent = active.get(player);
    if (parent?.leaf && leaf) { parent.leaf = false; native(); return; }
    if (parent) { this.lose(player, "recipient_mutation_reentrancy"); native(); return; }
    active.set(player, { leaf: false });
    const operation = {};
    let binding: { state: object; data: object; resources: object } | undefined;
    let before: Record<ResourceType, number> | null = null;
    let requested: Partial<Record<ResourceType, number>> | null = null;
    try {
      binding = { state: player.playerState, data: player.playerState.data, resources: player.getResources() };
      before = sample(binding.resources, true);
      requested = sample(request, false);
      if (!before || !requested) this.lose(player, "recipient_mutation_sample_missing");
    } catch { this.lose(player, "recipient_mutation_reader_failed"); }
    const publish = (phase: PlayerResourceMutation["phase"], after: Record<ResourceType, number> | null) => {
      let bindingValid = false;
      try { bindingValid = !!binding && player.playerState === binding.state &&
        player.playerState.data === binding.data && player.getResources() === binding.resources; }
      catch { this.lose(player, "recipient_mutation_reader_failed"); }
      if (!bindingValid) this.lose(player, "recipient_binding_replaced");
      [...group].forEach((entry) => {
        try { entry.event({ player, operation, kind, request, requested: requested ? { ...requested } : null,
          phase, before: before ? { ...before } : null, after: after ? { ...after } : null, bindingValid }); }
        catch { this.lose(player, "recipient_mutation_listener_failed"); }
      });
    };
    publish("before", null);
    let phase: "returned" | "threw" = "threw";
    try { native(); phase = "returned"; }
    finally {
      let after: Record<ResourceType, number> | null = null;
      try { after = sample(player.getResources(), true); }
      catch { this.lose(player, "recipient_mutation_reader_failed"); }
      if (!after || phase === "threw") this.lose(player, "recipient_mutation_incomplete");
      try { publish(phase, after); } finally { active.delete(player); }
    }
  }
}

function safely(callback: () => void): void { try { callback(); } catch { /* Passive failure stays isolated. */ } }

/** Reject unknown, accessor and malformed entries without invoking resource accessors as diagnostic work. */
function sample(resources: object, full: true): Record<ResourceType, number> | null;
function sample(resources: object, full: false): Partial<Record<ResourceType, number>> | null;
function sample(resources: object, full: boolean): Partial<Record<ResourceType, number>> | null {
  const types = Object.values(ResourceType), keys = Object.keys(resources);
  if (keys.length > types.length || keys.some((key) => !types.some((type) => type === key))) return null;
  const result: Partial<Record<ResourceType, number>> = {};
  for (const type of types) {
    const descriptor = Object.getOwnPropertyDescriptor(resources, type);
    if (!descriptor) { if (full) return null; continue; }
    if (!("value" in descriptor) || typeof descriptor.value !== "number" ||
      !Number.isFinite(descriptor.value) || descriptor.value < 0) return null;
    result[type] = descriptor.value;
  }
  return result;
}
