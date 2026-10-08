import { PlayerResourceObservation, ResourceType, type ProbableWafflePlayer, type PlayerResourceMutation } from
  "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { subscribeSceneResourceLoss } from "../../../data/scene-resource-observation";
import type { AiRuntimeResourceCoverageCapture } from "./ai-runtime-resource-coverage-capture";
import type { AiRuntimeProductionFactV1 } from "./ai-runtime-production-fact-v1";
import { installAiRuntimeResourceOperationIdentity } from "./ai-runtime-resource-operation-identity";

/** Bounded all-recipient native journal, sharing the root fact budget. Mutable aliases keep general authority unsupported. */
export class AiRuntimeRecipientResourceCapture {
  private readonly operations = new WeakMap<object, { id: number; sequence: number }>();
  private readonly bindings = new Map<ProbableWafflePlayer, {
    number: number; state: object; data: object; resources: object;
    balance: Record<ResourceType, number> | null; open: number;
  }>();
  private readonly cleanup: (() => void)[] = [];
  private nextId = 1;
  private disposed = false;

  constructor(private readonly scene: ProbableWaffleScene, private readonly coverage: AiRuntimeResourceCoverageCapture,
    private readonly boundary: (playerNumber: number) => { tick: number; sequence: number; playerNumber: number },
    private readonly frontier: () => number, private readonly append: (fact: AiRuntimeProductionFactV1) => void) {
    try {
      this.cleanup.push(installAiRuntimeResourceOperationIdentity(scene, (operation) => this.operations.get(operation)?.id ?? null));
      this.cleanup.push(subscribeSceneResourceLoss(scene, coverage.lose));
      for (const player of scene.players) {
        const number = player.playerNumber;
        if (number === undefined || !player.playerState || typeof player.getResources !== "function" ||
          this.bindings.size >= 256) { coverage.lose("recipient_installation_missing"); continue; }
        const balance = this.sample(player);
        this.bindings.set(player, { number, state: player.playerState, data: player.playerState.data,
          resources: player.getResources(), balance, open: 0 });
        this.append({ ...boundary(number), kind: "recipient_resources_installed", resources: balance });
        this.cleanup.push(PlayerResourceObservation.subscribe(player, (event) => this.observe(event), coverage.lose));
      }
    } catch (error) { this.coverage.lose("recipient_installation_failed"); this.dispose(); throw error; }
  }

  /** Called at existing tick/read boundaries, with no new scan/timer. Reconciliation detects bypasses, not net-zero alias writes. */
  reconcile(): void {
    if (this.disposed) return;
    if (this.scene.players.length !== this.bindings.size) this.coverage.lose("recipient_membership_changed");
    for (const [player, binding] of this.bindings) {
      if (!this.scene.players.includes(player) || player.playerNumber !== binding.number ||
        player.playerState !== binding.state || player.playerState.data !== binding.data ||
        player.getResources() !== binding.resources) this.coverage.lose("recipient_binding_replaced");
      if (binding.open) this.coverage.lose("recipient_operation_open_at_read");
      if (!equal(this.sample(player), binding.balance)) this.coverage.lose("recipient_unobserved_balance_change");
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.coverage.lose("recipient_capture_disposed");
    this.cleanup.splice(0).forEach((callback) => {
      try { callback(); } catch { this.coverage.lose("recipient_cleanup_failed"); }
    });
    this.bindings.clear();
  }

  private observe(event: PlayerResourceMutation): void {
    if (this.disposed) return;
    const binding = this.bindings.get(event.player);
    if (!binding) { this.coverage.lose("recipient_unknown_player"); return; }
    if (!this.scene.players.includes(event.player) || event.player.playerNumber !== binding.number ||
      event.player.playerState !== binding.state || event.player.playerState.data !== binding.data ||
      event.player.getResources() !== binding.resources) this.coverage.lose("recipient_binding_replaced");
    let operation = this.operations.get(event.operation);
    if (event.phase === "before") {
      if (operation || binding.open || this.nextId > 8192) { this.coverage.lose("recipient_operation_identity_loss"); return; }
      operation = { id: this.nextId++, sequence: this.frontier() + 1 };
      this.operations.set(event.operation, operation);
      binding.open++;
      if (!equal(event.before, binding.balance)) this.coverage.lose("recipient_unobserved_balance_change");
    } else {
      if (!operation || binding.open !== 1) { this.coverage.lose("recipient_terminal_without_entry"); return; }
      binding.open = 0;
      binding.balance = event.after;
      const sign = event.kind === "add" ? 1 : -1;
      if (event.phase !== "returned" || !event.requested || !event.before || !event.after ||
        !Object.values(ResourceType).every((type) => event.after?.[type] ===
          (event.before?.[type] ?? NaN) + sign * (event.requested?.[type] ?? 0))) {
        this.coverage.lose("recipient_mutation_quantitative_history_missing");
      }
    }
    if (!operation) return;
    if (!event.bindingValid) this.coverage.lose("recipient_binding_replaced");
    this.append({ ...this.boundary(binding.number), kind: "recipient_resource_mutation", mutation: {
      operationId: operation.id, action: event.kind, phase: event.phase, entrySequence: operation.sequence,
      requested: event.requested, before: event.before, after: event.after, bindingValid: event.bindingValid,
      lossEpoch: this.coverage.read().lossEpoch
    } });
  }

  private sample(player: ProbableWafflePlayer): Record<ResourceType, number> | null {
    try {
      const resources = player.getResources();
      if (Object.values(ResourceType).some((type) => !Number.isFinite(resources[type]) || resources[type] < 0)) {
        this.coverage.lose("recipient_balance_missing"); return null;
      }
      return { ...resources };
    } catch { this.coverage.lose("recipient_balance_reader_failed"); return null; }
  }
}

function equal(left: Record<ResourceType, number> | null, right: Record<ResourceType, number> | null): boolean {
  return !!left && !!right && Object.values(ResourceType).every((type) => left[type] === right[type]);
}
