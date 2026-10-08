import type Phaser from "phaser";
import type { ResourceCargoSample } from "./resource-cargo-sample";
import type { ResourceCargoChange } from "./resource-cargo-change";
import type { ResourceServiceEvent } from "./resource-service-event";
import type { ResourceTransferContext } from "./resource-transfer-context";

/** Bounded passive actor subscriptions. Reads/handles exist only for marked actors; failures never alter native mutations. */
export class ResourceServiceObservation {
  private static readonly listeners = new WeakMap<Phaser.GameObjects.GameObject, Set<(event: ResourceServiceEvent) => void>>();

  static subscribe(actor: Phaser.GameObjects.GameObject, listener: (event: ResourceServiceEvent) => void): () => void {
    const observers = this.listeners.get(actor) ?? new Set();
    if (observers.size >= 8) return () => undefined;
    observers.add(listener); this.listeners.set(actor, observers);
    return () => { observers.delete(listener); if (!observers.size) this.listeners.delete(actor); };
  }

  static observed(actor: Phaser.GameObjects.GameObject): boolean { return !!this.listeners.get(actor)?.size; }

  static publish(event: ResourceServiceEvent): void {
    this.listeners.get(event.actor)?.forEach((listener) => {
      try { listener(event); } catch { /* Failed diagnostics cannot interrupt native side effects. */ }
    });
  }

  /** Observe the exact before/after mutation, including an attempted restore before any restore field changes. */
  static change(actor: Phaser.GameObjects.GameObject, cargoOwner: object, sample: () => ResourceCargoSample,
    change: ResourceCargoChange, mutate: () => void): void {
    if (!this.observed(actor)) { mutate(); return; }
    let before: ResourceCargoSample | undefined;
    try { before = sample(); } catch { /* Native mutation must still run once. */ }
    mutate();
    try { if (before) this.publish({ kind: "cargo_changed", actor, cargoOwner, change, before, after: sample() }); }
    catch { /* Missing after sample leaves the diagnostic interval incomplete. */ }
  }

  /** Freeze the pile actually passed to the drain/emitter, before any native await or credit callback. */
  static offer(actor: Phaser.GameObjects.GameObject, cargoOwner: object, target: Phaser.GameObjects.GameObject,
    sample: () => ResourceCargoSample, execution?: object): ResourceTransferContext | undefined {
    if (!this.observed(actor)) return undefined;
    try {
      const context = { cargoOwner, execution, transfer: {} } satisfies ResourceTransferContext;
      this.publish({ kind: "cargo_offered", actor, context, target, cargo: sample() });
      return context;
    } catch { return undefined; }
  }
}
