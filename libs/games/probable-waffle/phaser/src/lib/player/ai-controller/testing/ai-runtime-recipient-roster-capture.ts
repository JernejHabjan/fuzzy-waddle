import type { ProbableWaffleGameInstance } from "@fuzzy-waddle/probable-waffle-protocol";

type RosterMethod = "addPlayer" | "removePlayerByUserId" | "removePlayerByPlayer" | "stopLevel";
type Loss = (reason: string) => void;
type RosterWrapper = (this: unknown, ...args: unknown[]) => unknown;
type InstalledMethod = {
  readonly key: RosterMethod;
  readonly original: PropertyDescriptor | undefined;
  readonly wrapper: RosterWrapper;
};

/** Test-owned observation of the exact roster mutation methods on one game instance. */
export class AiRuntimeRecipientRosterCapture {
  private static readonly owners = new WeakMap<object, AiRuntimeRecipientRosterCapture>();
  private readonly installed: InstalledMethod[] = [];
  private disposed = false;

  constructor(private readonly gameInstance: ProbableWaffleGameInstance, private readonly lose: Loss) {
    if (AiRuntimeRecipientRosterCapture.owners.has(gameInstance)) {
      lose("recipient_roster_capture_duplicated");
      this.disposed = true;
      return;
    }
    AiRuntimeRecipientRosterCapture.owners.set(gameInstance, this);
    try {
      for (const key of ["addPlayer", "removePlayerByUserId", "removePlayerByPlayer", "stopLevel"] as const) {
        this.install(key);
      }
    } catch {
      lose("recipient_roster_installation_failed");
      this.dispose();
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.lose("recipient_roster_capture_disposed");
    for (const item of this.installed.splice(0).reverse()) {
      if (Object.getOwnPropertyDescriptor(this.gameInstance, item.key)?.value !== item.wrapper) {
        this.lose("recipient_roster_wrapper_replaced");
        continue;
      }
      try {
        if (item.original) Object.defineProperty(this.gameInstance, item.key, item.original);
        else Reflect.deleteProperty(this.gameInstance, item.key);
      } catch {
        this.lose("recipient_roster_restore_failed");
      }
    }
    if (AiRuntimeRecipientRosterCapture.owners.get(this.gameInstance) === this) {
      AiRuntimeRecipientRosterCapture.owners.delete(this.gameInstance);
    }
  }

  private install(key: RosterMethod): void {
    const original = Object.getOwnPropertyDescriptor(this.gameInstance, key);
    const method = this.gameInstance[key];
    if (typeof method !== "function") throw new Error("recipient_roster_method_missing");
    const lose = this.lose;
    const wrapper = function (this: unknown, ...args: unknown[]): unknown {
      try { lose(key === "stopLevel" ? "recipient_level_reset" : "recipient_roster_mutation"); } catch { /* Keep native behavior. */ }
      return Reflect.apply(method, this, args);
    };
    Object.defineProperty(this.gameInstance, key, {
      configurable: true,
      enumerable: original?.enumerable ?? false,
      writable: true,
      value: wrapper
    });
    this.installed.push({ key, original, wrapper });
  }
}
