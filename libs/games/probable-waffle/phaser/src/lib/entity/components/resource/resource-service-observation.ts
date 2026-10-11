import type Phaser from "phaser";
import type { ResourceCargoSample } from "./resource-cargo-sample";
import type { ResourceCargoChange } from "./resource-cargo-change";
import type { ResourceServiceEvent } from "./resource-service-event";
import type { ResourceTransferContext } from "./resource-transfer-context";

/** Bounded passive actor subscriptions. Reads/handles exist only for marked actors; failures never alter native mutations. */
export class ResourceServiceObservation {
  private static readonly listeners = new WeakMap<Phaser.GameObjects.GameObject,
    Set<{ event: (event: ResourceServiceEvent) => void; loss?: (reason: string) => void }>>();

  static subscribe(actor: Phaser.GameObjects.GameObject, listener: (event: ResourceServiceEvent) => void,
    loss?: (reason: string) => void, installed?: () => void): () => void {
    const observers = this.listeners.get(actor) ??
      new Set<{ event: (event: ResourceServiceEvent) => void; loss?: (reason: string) => void }>();
    if (observers.size >= 8) { this.reportLoss(loss, "resource_subscription_overflow"); return () => undefined; }
    const observer = { event: listener, loss };
    observers.add(observer); this.listeners.set(actor, observers);
    try { installed?.(); } catch { this.reportLoss(loss, "resource_installation_read_failed"); }
    return () => { if (!observers.has(observer)) return;
      this.reportLoss(loss, "resource_unsubscribed");
      observers.delete(observer); if (!observers.size) this.listeners.delete(actor); };
  }

  static observed(actor: Phaser.GameObjects.GameObject): boolean { return !!this.listeners.get(actor)?.size; }

  static publish(event: ResourceServiceEvent): void {
    this.listeners.get(event.actor)?.forEach((listener) => {
      try { listener.event(event); } catch { this.reportLoss(listener.loss, "resource_listener_failed"); }
    });
  }

  /** Bind execution to the current cargo generation before native guards/awaits; a later restore cannot rebind it. */
  static begin(actor: Phaser.GameObjects.GameObject, cargoOwner: object, target: Phaser.GameObjects.GameObject,
    sample: () => ResourceCargoSample, execution?: object): void {
    if (!this.observed(actor)) return;
    try { this.publish({ kind: "cargo_started", actor, cargoOwner, target, execution, cargo: sample() }); }
    catch { this.loss(actor, "resource_entry_read_failed"); }
  }

  /** Observe the exact before/after mutation, including an attempted restore before any restore field changes. */
  static change(actor: Phaser.GameObjects.GameObject, cargoOwner: object, sample: () => ResourceCargoSample,
    change: ResourceCargoChange, mutate: () => void): void {
    if (!this.observed(actor)) { mutate(); return; }
    if (change.reason === "restore") this.loss(actor, "resource_restore_attempt");
    let before: ResourceCargoSample | undefined;
    try { before = sample(); } catch { this.loss(actor, "resource_before_read_failed"); }
    try { mutate(); } catch (error) { this.loss(actor, "resource_mutation_threw"); throw error; }
    try { if (before) this.publish({ kind: "cargo_changed", actor, cargoOwner, change, before, after: sample() }); }
    catch { this.loss(actor, "resource_after_read_failed"); }
  }

  /** Freeze the pile actually passed to the drain/emitter, before any native await or credit callback. */
  static offer(actor: Phaser.GameObjects.GameObject, cargoOwner: object, target: Phaser.GameObjects.GameObject,
    sample: () => ResourceCargoSample, execution?: object): ResourceTransferContext | undefined {
    if (!this.observed(actor)) return undefined;
    try {
      const context = { cargoOwner, execution, transfer: {} } satisfies ResourceTransferContext;
      this.publish({ kind: "cargo_offered", actor, context, target, cargo: sample() });
      return context;
    } catch { this.loss(actor, "resource_offer_read_failed"); return undefined; }
  }

  private static loss(actor: Phaser.GameObjects.GameObject, reason: string): void {
    this.listeners.get(actor)?.forEach((listener) => this.reportLoss(listener.loss, reason));
  }

  /** A failing diagnostic sink must never replace a native result/error. */
  private static reportLoss(loss: ((reason: string) => void) | undefined, reason: string): void {
    try { loss?.(reason); } catch { /* Preserve native work. */ }
  }
}
