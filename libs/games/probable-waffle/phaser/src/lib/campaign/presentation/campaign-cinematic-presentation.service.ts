import Phaser from "phaser";
import { BehaviorSubject } from "rxjs";
import {
  buildCampaignDialogueProjection,
  CampaignCinematicPresentationService,
  type CampaignDialogueLineProjection,
  type CampaignDialogueLogProjectionItem,
  type CampaignPresentationCategory,
  CampaignPresentationPriorityQueue,
  type CampaignSeenCinematicStore,
  cinematicHoldProgress,
  cinematicSkipInputMode,
  createMissionTextResolver,
  type MissionCinematicDefinition,
  type MissionCinematicPresentationRequest,
  type MissionCinematicPresentationSnapshot,
  type MissionDialogueBundle,
  type MissionDialogueLine,
  type MissionPresentationCue
} from "@fuzzy-waddle/probable-waffle-campaign";
import type { CampaignId, CampaignMissionRuntimeState } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { getGameObjectLogicalTransform } from "../../data/game-object-helper";
import { CameraMovementHandler } from "../../player/human-controller/cameraMovementHandler";
import { AudioService } from "../../world/services/audio.service";
import { getSceneComponent, getSceneService } from "../../world/services/scene-component-helpers";
import { SimulationPauseReason, SimulationTickService } from "../../world/services/simulation-tick.service";
import type { CampaignPresentationRequest } from "../actions/campaign-phaser-world-adapter";

/**
 * Local-only cinematic and dialogue presenter. It consumes deterministic presentation
 * requests while owning camera, input, audio, and pause cleanup so those transient
 * choices never become synchronized mission state.
 *
 * @see CampaignCinematicPresentationService for the framework-free projection contract.
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/706
 */
import { IndexedScenarioReferenceRegistry } from "../scenario/scenario-reference-registry";

const DEFAULT_LINE_TICKS = 40;
const DEFAULT_CINEMATIC_TIMEOUT_TICKS = 2_400;
const SEEN_CINEMATICS_KEY = "probable-waffle-campaign-seen-cinematics-v1";

/**
 * Defines the structured campaign cinematic view state contract for this module. Its declared surface makes
 * active, cinematic id, title, subtitle, can acknowledge explicit to every consumer. Use this shared shape
 * rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignCinematicViewState {
  /**
   * active value carried by {@link CampaignCinematicViewState}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly active: boolean;
  /**
   * Optional stable cinematic id used by {@link CampaignCinematicViewState} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly cinematicId?: string;
  /**
   * Optional human-facing title for {@link CampaignCinematicViewState}. It supports UI, narration, or
   * diagnostics and must not be used as the stable identity of the record.
   */
  readonly title?: string;
  /**
   * Optional human-facing subtitle for {@link CampaignCinematicViewState}. It supports UI, narration, or
   * diagnostics and must not be used as the stable identity of the record.
   */
  readonly subtitle?: CampaignDialogueLineProjection;
  /**
   * boolean policy/value on {@link CampaignCinematicViewState} that explicitly controls whether the associated
   * behavior is active; do not infer it from unrelated state.
   */
  readonly canAcknowledge: boolean;
  /**
   * letterbox value carried by {@link CampaignCinematicViewState}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly letterbox: boolean;
  /**
   * ui suppressed value carried by {@link CampaignCinematicViewState}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly uiSuppressed: boolean;
  /**
   * discriminator for {@link CampaignCinematicViewState}. It selects the valid branch and behavior, so producers
   * and consumers must keep it synchronized with the accompanying fields.
   */
  readonly skipMode: "hold" | "tap";
  /**
   * numeric skip progress carried by {@link CampaignCinematicViewState}. Its units and valid range are defined
   * by {@link CampaignCinematicViewState} and must remain consistent across producers and consumers.
   */
  readonly skipProgress: number;
  /**
   * collection value on {@link CampaignCinematicViewState}. Its element type defines the records that may cross
   * this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly dialogueLog: readonly CampaignDialogueLogProjectionItem[];
}

/**
 * Defines the structured campaign cinematic presentation callbacks contract for this module. Its declared
 * surface makes dialogue presented, dialogue acknowledged, cinematic cue, cinematic finished explicit to every
 * consumer. Use this shared shape rather than an ad-hoc object so adapters, persistence, and callers remain
 * compatible.
 */
export interface CampaignCinematicPresentationCallbacks {
  /**
   * operation exposed by {@link CampaignCinematicPresentationCallbacks}. Its signature is the compatibility
   * boundary for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  dialoguePresented(lineId: string, ownerToken: string): void;
  /**
   * operation exposed by {@link CampaignCinematicPresentationCallbacks}. Its signature is the compatibility
   * boundary for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  dialogueAcknowledged(lineId: string, ownerToken: string): void;
  /**
   * operation exposed by {@link CampaignCinematicPresentationCallbacks}. Its signature is the compatibility
   * boundary for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  cinematicCue(cinematicId: string, cueIndex: number): void;
  /**
   * operation exposed by {@link CampaignCinematicPresentationCallbacks}. Its signature is the compatibility
   * boundary for implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  cinematicFinished(cinematicId: string, skipped: boolean): void;
}

/**
 * Defines the structured pending dialogue contract for this module. Its declared surface makes message id,
 * line, owner token explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
interface PendingDialogue {
  /**
   * stable message id used by {@link PendingDialogue} to correlate this value with related records, events, or
   * authored content; it is not a display label.
   */
  readonly messageId: string;
  /**
   * line value carried by {@link PendingDialogue}. Its declared type is the compatibility boundary for
   * producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly line: MissionDialogueLine;
  /**
   * string owner token carried by {@link PendingDialogue}. Treat it according to the owning contract’s
   * validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly ownerToken: string;
}

/**
 * Defines the structured active dialogue contract for this module. Its declared surface makes cinematic, on
 * complete explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
interface ActiveDialogue extends PendingDialogue {
  /**
   * cinematic value carried by {@link ActiveDialogue}. Its declared type is the compatibility boundary for
   * producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly cinematic: boolean;
  /**
   * Optional callback/hook supplied to {@link ActiveDialogue}. The owner controls when it runs; implementations
   * must preserve the documented lifecycle and cleanup boundary.
   */
  readonly onComplete?: () => void;
}

/**
 * Local-only projection of deterministic dialogue and cinematic requests. It owns camera,
 * input, subtitles, audio, queue priority, skip gestures, and cleanup, while emitting
 * acknowledgements back through the event adapter rather than writing mission state.
 *
 * ```text
 * runtime presentation effect -> local queue -> camera/UI/audio projection
 *                                      |                 |
 *                              skip/finish acknowledgement +-> deterministic event queue
 * ```
 *
 * Directed cinematics may temporarily own local control/camera; paused cinematics add
 * only their named simulation pause reason and always restore the prior local values.
 */
export class PhaserCampaignCinematicPresentationService extends CampaignCinematicPresentationService {
  private readonly viewSubject = new BehaviorSubject<CampaignCinematicViewState>(emptyView());
  private readonly queue = new CampaignPresentationPriorityQueue();
  private readonly pendingDialogue = new Map<string, PendingDialogue>();
  private readonly activeAudioKeys = new Map<string, number>();
  private readonly linesById: ReadonlyMap<string, MissionDialogueLine>;
  private readonly text: ReturnType<typeof createMissionTextResolver>;
  private runtimeState: CampaignMissionRuntimeState;
  private activeDialogue?: ActiveDialogue;
  private request?: MissionCinematicPresentationRequest;
  private cueIndex = 0;
  private cueTimer?: Phaser.Time.TimerEvent;
  private fallbackTimer?: Phaser.Time.TimerEvent;
  private dialogueTimer?: Phaser.Time.TimerEvent;
  private cameraTween?: Phaser.Tweens.Tween;
  private skipHeldAtMs?: number;
  private previousInputEnabled?: boolean;
  private previousCameraMovementEnabled?: boolean;
  private destroyed = false;

  readonly view$ = this.viewSubject.asObservable();

  constructor(
    private readonly scene: ProbableWaffleScene,
    private readonly campaignId: CampaignId,
    private readonly dialogue: MissionDialogueBundle,
    initialState: CampaignMissionRuntimeState,
    private readonly callbacks: CampaignCinematicPresentationCallbacks,
    private readonly seenCinematics: CampaignSeenCinematicStore = new LocalCampaignSeenCinematicStore()
  ) {
    super();
    this.runtimeState = initialState;
    this.linesById = new Map(dialogue.lines.map((line) => [String(line.id), line]));
    this.text = createMissionTextResolver(dialogue);
    this.syncState(initialState);
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.updateFrameNonDeterministic, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  get view(): CampaignCinematicViewState {
    return this.viewSubject.value;
  }

  syncState(state: CampaignMissionRuntimeState): void {
    this.runtimeState = state;
    const projection = buildCampaignDialogueProjection(this.dialogue, state);
    this.patchView({ dialogueLog: projection.log });
  }

  handleRequest(request: CampaignPresentationRequest): void {
    if (request.kind === "checkpoint") return;
    if (request.kind === "cancel") {
      if (request.presentationKind === "cinematic" && this.request?.definition.id === request.id) {
        this.cleanupPresentation();
      } else if (request.presentationKind === "dialogue") {
        this.cancelDialogue(request.id, request.ownerToken);
      }
      return;
    }
    if (request.kind === "dialogue") {
      this.enqueueDialogue(request.id, request.ownerToken);
      return;
    }
    const definition = this.dialogue.cinematics.find((cinematic) => cinematic.id === request.id);
    if (!definition) {
      this.callbacks.cinematicFinished(request.id, false);
      return;
    }
    this.play({
      campaignId: this.campaignId,
      ownerToken: request.ownerToken,
      definition,
      dialogue: this.dialogue,
      previouslySeen: this.seenCinematics.hasSeen(this.campaignId, definition.id)
    });
  }

  play(request: MissionCinematicPresentationRequest): void {
    this.suspendStandaloneDialogue();
    this.cleanupPresentation(false);
    this.request = request;
    this.cueIndex = request.resumeCueIndex ?? 0;
    this.applyModeOwnership(request.definition);
    this.patchView({
      active: true,
      cinematicId: request.definition.id,
      title: undefined,
      subtitle: undefined,
      canAcknowledge: false,
      letterbox: request.definition.mode !== "gameplay",
      uiSuppressed: request.definition.mode !== "gameplay",
      skipMode: cinematicSkipInputMode(request.definition, request.previouslySeen),
      skipProgress: 0
    });
    this.fallbackTimer = this.scene.time.delayedCall(
      ticksToMs(request.definition.fallbackTimeoutTicks ?? DEFAULT_CINEMATIC_TIMEOUT_TICKS),
      () => this.finishCinematic(false)
    );
    this.runNextCue();
  }

  restore(snapshot: MissionCinematicPresentationSnapshot): void {
    const definition = this.dialogue.cinematics.find((cinematic) => cinematic.id === snapshot.cinematicId);
    if (!definition || snapshot.stage === "finalizing") {
      this.cleanupPresentation();
      return;
    }
    const resumeCueIndex = safeResumeCueIndex(definition, snapshot.cueIndex);
    this.play({
      campaignId: this.campaignId,
      ownerToken: snapshot.ownerToken,
      definition,
      dialogue: this.dialogue,
      previouslySeen: this.seenCinematics.hasSeen(this.campaignId, definition.id),
      resumeCueIndex
    });
  }

  restoreRuntimePresentation(state: CampaignMissionRuntimeState): void {
    this.syncState(state);
    const activeId = state.activeCinematicId;
    const cinematic = activeId ? state.cinematics[activeId] : undefined;
    if (cinematic?.stage === "presenting") {
      this.restore({
        cinematicId: cinematic.cinematicId as MissionCinematicDefinition["id"],
        ownerToken: cinematic.ownerToken,
        cueIndex: cinematic.presentationCueIndex ?? 0,
        stage: "presenting"
      });
    } else if (!cinematic || cinematic.stage === "finalizing" || cinematic.stage === "completed") {
      this.cleanupPresentation();
    }
    for (const presentation of Object.values(state.dialoguePresentations)) {
      if (presentation.status === "presenting" && !presentation.ownerToken.startsWith("cinematic:")) {
        this.enqueueDialogue(presentation.lineId, presentation.ownerToken);
      }
    }
  }

  requestSkip(held: boolean): void {
    if (!this.request) return;
    if (!held) {
      this.skipHeldAtMs = undefined;
      this.patchView({ skipProgress: 0 });
      return;
    }
    if (this.view.skipMode === "tap") {
      this.finishCinematic(true);
      return;
    }
    this.skipHeldAtMs ??= this.scene.time.now;
  }

  acknowledgeDialogue(): void {
    if (!this.activeDialogue || !this.view.canAcknowledge) return;
    this.finishActiveDialogue();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.updateFrameNonDeterministic, this);
    this.cleanupPresentation(false);
    this.queue.clear();
    this.pendingDialogue.clear();
    this.destroyed = true;
    this.viewSubject.complete();
  }

  private enqueueDialogue(lineId: string, ownerToken: string): void {
    const line = this.linesById.get(lineId);
    if (!line) {
      this.callbacks.dialogueAcknowledged(lineId, ownerToken);
      return;
    }
    const messageId = `dialogue:${ownerToken}:${lineId}`;
    if (this.activeDialogue?.messageId === messageId || this.pendingDialogue.has(messageId)) return;
    this.queueDialogue({ messageId, line, ownerToken });
    this.showNextDialogue();
  }

  private queueDialogue(pending: PendingDialogue): void {
    this.pendingDialogue.set(pending.messageId, pending);
    this.queue.enqueue({
      id: pending.messageId,
      sourceId: pending.line.id,
      category: campaignDialoguePresentationCategory(pending.line.delivery),
      text: pending.line.text
    });
  }

  private suspendStandaloneDialogue(): void {
    const active = this.activeDialogue;
    if (!active || active.cinematic) return;
    this.dialogueTimer?.destroy();
    this.dialogueTimer = undefined;
    this.activeDialogue = undefined;
    this.patchView({ subtitle: undefined, canAcknowledge: false });
    this.queueDialogue({
      messageId: active.messageId,
      line: active.line,
      ownerToken: active.ownerToken
    });
  }

  private showNextDialogue(): void {
    if (this.activeDialogue || this.request) return;
    const message = this.queue.take();
    if (!message) return;
    const pending = this.pendingDialogue.get(message.id);
    this.pendingDialogue.delete(message.id);
    if (!pending) {
      this.showNextDialogue();
      return;
    }
    this.startDialogue(pending.line, pending.ownerToken, false);
  }

  /**
   * Starts a local dialogue projection and reports its deterministic "presented" event
   * before waiting for the authored minimum duration. Blocking lines require explicit
   * acknowledgement; non-blocking lines acknowledge themselves after the timer.
   */
  private startDialogue(
    line: MissionDialogueLine,
    ownerToken: string,
    cinematic: boolean,
    onComplete?: () => void
  ): void {
    this.cancelActiveDialogue(false);
    const messageId = `dialogue:${ownerToken}:${line.id}`;
    this.activeDialogue = { messageId, line, ownerToken, cinematic, onComplete };
    this.callbacks.dialoguePresented(line.id, ownerToken);
    const projection = buildCampaignDialogueProjection(this.dialogue, this.runtimeState);
    const subtitle =
      projection.active.find((candidate) => candidate.ownerToken === ownerToken) ??
      projectTransientLine(this.dialogue, line, ownerToken);
    this.patchView({ subtitle, canAcknowledge: false });
    this.playVoiceIfAvailable(line);
    this.dialogueTimer = this.scene.time.delayedCall(ticksToMs(line.minimumTicks ?? DEFAULT_LINE_TICKS), () => {
      this.dialogueTimer = undefined;
      if (line.delivery === "blocking") this.patchView({ canAcknowledge: true });
      else this.finishActiveDialogue();
    });
  }

  private finishActiveDialogue(): void {
    const active = this.activeDialogue;
    if (!active) return;
    this.dialogueTimer?.destroy();
    this.dialogueTimer = undefined;
    this.activeDialogue = undefined;
    this.patchView({ subtitle: undefined, canAcknowledge: false });
    this.callbacks.dialogueAcknowledged(active.line.id, active.ownerToken);
    active.onComplete?.();
    if (!active.cinematic) this.showNextDialogue();
  }

  private cancelDialogue(lineId: string, ownerToken: string): void {
    const messageId = `dialogue:${ownerToken}:${lineId}`;
    this.pendingDialogue.delete(messageId);
    if (this.activeDialogue?.messageId === messageId) this.cancelActiveDialogue(false);
  }

  private cancelActiveDialogue(invokeCompletion: boolean): void {
    const active = this.activeDialogue;
    this.dialogueTimer?.destroy();
    this.dialogueTimer = undefined;
    this.activeDialogue = undefined;
    this.patchView({ subtitle: undefined, canAcknowledge: false });
    if (invokeCompletion) active?.onComplete?.();
  }

  /**
   * Advances the ordered cinematic timeline one cue at a time. Every selected cue index
   * is reported to the runtime before local playback, making a skipped, replayed, or
   * restored cinematic converge on the same authored continuation point.
   */
  private runNextCue(): void {
    const request = this.request;
    if (!request) return;
    if (this.cueIndex >= request.definition.timeline.length) {
      this.finishCinematic(false);
      return;
    }
    const cueIndex = this.cueIndex;
    const cue = request.definition.timeline[cueIndex]!;
    this.callbacks.cinematicCue(request.definition.id, cueIndex);
    try {
      this.runCue(cue, () => {
        if (!this.request) return;
        this.cueIndex = cueIndex + 1;
        this.runNextCue();
      });
    } catch {
      this.finishCinematic(false);
    }
  }

  /**
   * Interprets a single presentation cue without letting missing optional assets block
   * mission progress. Each asynchronous cue must invoke `done` exactly once; pure view
   * changes complete immediately and leave deterministic sequencing to `runNextCue`.
   */
  private runCue(cue: MissionPresentationCue, done: () => void): void {
    switch (cue.kind) {
      case "dialogue": {
        const line = this.linesById.get(cue.lineId);
        if (!line) {
          done();
          return;
        }
        this.startDialogue(line, `cinematic:${this.request!.definition.id}:cue:${this.cueIndex}`, true, done);
        return;
      }
      case "wait":
        this.waitForTicks(cue.durationTicks, done);
        return;
      case "letterbox":
        this.patchView({ letterbox: cue.visible });
        done();
        return;
      case "title":
        this.patchView({ title: this.text(cue.textId) });
        done();
        return;
      case "camera-shot":
        this.runCameraCue(cue, done);
        return;
      case "camera-actor":
        this.runCameraCue(cue, done);
        return;
      case "audio":
        this.runAudioCue(cue, done);
        return;
      case "ui-suppression":
        this.patchView({ uiSuppressed: cue.suppressed });
        done();
        return;
      case "actor-animation": {
        const actor = getSceneService(this.scene, IndexedScenarioReferenceRegistry)?.actor(cue.actorId);
        const animated = actor as Phaser.GameObjects.Sprite | undefined;
        if (animated?.anims && this.scene.anims.exists(cue.animationKey)) animated.play(cue.animationKey);
        done();
      }
    }
  }

  private runCameraCue(
    cue: Extract<MissionPresentationCue, { readonly kind: "camera-shot" | "camera-actor" }>,
    done: () => void
  ): void {
    const registry = getSceneService(this.scene, IndexedScenarioReferenceRegistry);
    const shot = cue.kind === "camera-shot" ? registry?.cameraShot(cue.shotId) : undefined;
    const actor = cue.kind === "camera-actor" ? registry?.actor(cue.actorId) : undefined;
    const target = campaignCameraCueTarget(
      shot?.center ?? getGameObjectLogicalTransform(actor),
      cue.fallbackPointId ? registry?.point(cue.fallbackPointId) : undefined
    );
    const durationTicks = cue.durationTicks ?? shot?.durationTicks ?? 0;
    if (!target) {
      this.waitForTicks(durationTicks, done);
      return;
    }
    const camera = this.scene.cameras.main;
    const duration = ticksToMs(durationTicks);
    if (shot?.letterbox) this.patchView({ letterbox: true });
    if (duration <= 0) {
      camera.centerOn(target.x, target.y - target.z);
      if (shot) camera.setZoom(shot.zoom);
      done();
      return;
    }
    const destination = {
      scrollX: target.x - camera.width / (2 * camera.zoom),
      scrollY: target.y - target.z - camera.height / (2 * camera.zoom),
      zoom: shot?.zoom ?? camera.zoom
    };
    this.cameraTween = this.scene.tweens.add({
      targets: camera,
      ...destination,
      duration,
      ease: "Sine.InOut",
      onComplete: () => {
        this.cameraTween = undefined;
        done();
      }
    });
  }

  /**
   * Plays an optional audio cue according to its authored wait policy. Unavailable audio
   * is treated as a presentation-only skip, so asset loading differences cannot stall a
   * mission or change its persisted runtime timeline.
   */
  private runAudioCue(cue: Extract<MissionPresentationCue, { readonly kind: "audio" }>, done: () => void): void {
    const audio = getSceneService(this.scene, AudioService);
    const playback = campaignAudioCuePlayback(
      this.scene.cache.audio.exists(cue.assetKey),
      audio !== undefined,
      cue.waitForCompletion === true
    );
    if (playback === "skip") {
      done();
      return;
    }
    this.trackAudio(cue.assetKey);
    audio!.playAudio(cue.assetKey, undefined, {
      onComplete: () => {
        this.releaseAudio(cue.assetKey);
        if (playback === "play-and-wait") done();
      }
    });
    if (playback === "play-and-continue") done();
  }

  private playVoiceIfAvailable(line: MissionDialogueLine): void {
    if (!line.audioAssetKey || !this.scene.cache.audio.exists(line.audioAssetKey)) return;
    const audio = getSceneService(this.scene, AudioService);
    if (!audio) return;
    this.trackAudio(line.audioAssetKey);
    try {
      audio.playAudio(line.audioAssetKey, undefined, { onComplete: () => this.releaseAudio(line.audioAssetKey!) });
    } catch {
      this.releaseAudio(line.audioAssetKey);
    }
  }

  private waitForTicks(ticks: number, done: () => void): void {
    if (ticks <= 0) {
      done();
      return;
    }
    this.cueTimer = this.scene.time.delayedCall(ticksToMs(ticks), () => {
      this.cueTimer = undefined;
      done();
    });
  }

  private applyModeOwnership(definition: MissionCinematicDefinition): void {
    const { lockControl, lockCamera, pauseSimulation } = campaignCinematicOwnership(definition);
    if (lockControl) {
      this.previousInputEnabled = this.scene.input.enabled;
      this.scene.input.enabled = false;
    }
    if (lockCamera) {
      const cameraMovement = getSceneComponent(this.scene, CameraMovementHandler);
      if (cameraMovement) {
        this.previousCameraMovementEnabled = cameraMovement.isEnabled;
        cameraMovement.setEnabled(false);
      }
    }
    if (pauseSimulation) {
      getSceneService(this.scene, SimulationTickService)?.pauseTick(SimulationPauseReason.CampaignCinematic);
    }
  }

  /**
   * Releases every local resource acquired by dialogue/cinematic playback and restores
   * previous input, camera, and simulation ownership. It is intentionally idempotent so
   * normal completion, skip, restore, and scene shutdown share one safe unwind path.
   */
  private cleanupPresentation(showQueuedDialogue = true): void {
    const mode = this.request?.definition.mode;
    this.cueTimer?.destroy();
    this.fallbackTimer?.destroy();
    this.cameraTween?.stop();
    this.cueTimer = undefined;
    this.fallbackTimer = undefined;
    this.cameraTween = undefined;
    this.skipHeldAtMs = undefined;
    for (const key of this.activeAudioKeys.keys()) this.scene.sound.stopByKey(key);
    this.activeAudioKeys.clear();
    this.cancelActiveDialogue(false);
    if (this.previousInputEnabled !== undefined) this.scene.input.enabled = this.previousInputEnabled;
    this.previousInputEnabled = undefined;
    if (this.previousCameraMovementEnabled !== undefined) {
      getSceneComponent(this.scene, CameraMovementHandler)?.setEnabled(this.previousCameraMovementEnabled);
    }
    this.previousCameraMovementEnabled = undefined;
    if (mode === "paused") {
      getSceneService(this.scene, SimulationTickService)?.resumeTick(SimulationPauseReason.CampaignCinematic);
    }
    this.request = undefined;
    this.patchView({
      active: false,
      cinematicId: undefined,
      title: undefined,
      subtitle: undefined,
      canAcknowledge: false,
      letterbox: false,
      uiSuppressed: false,
      skipProgress: 0
    });
    if (showQueuedDialogue) this.showNextDialogue();
  }

  private finishCinematic(skipped: boolean): void {
    const request = this.request;
    if (!request) return;
    this.seenCinematics.markSeen(this.campaignId, request.definition.id);
    const cinematicId = request.definition.id;
    this.cleanupPresentation();
    this.callbacks.cinematicFinished(cinematicId, skipped);
  }

  private updateFrameNonDeterministic(): void {
    if (this.skipHeldAtMs === undefined || !this.request) return;
    const progress = cinematicHoldProgress(this.skipHeldAtMs, this.scene.time.now);
    this.patchView({ skipProgress: progress });
    if (progress >= 1) this.finishCinematic(true);
  }

  private patchView(patch: Partial<CampaignCinematicViewState>): void {
    if (this.destroyed) return;
    this.viewSubject.next({ ...this.viewSubject.value, ...patch });
  }

  private trackAudio(key: string): void {
    this.activeAudioKeys.set(key, (this.activeAudioKeys.get(key) ?? 0) + 1);
  }

  private releaseAudio(key: string): void {
    const remaining = (this.activeAudioKeys.get(key) ?? 1) - 1;
    if (remaining > 0) this.activeAudioKeys.set(key, remaining);
    else this.activeAudioKeys.delete(key);
  }
}

export function campaignCinematicOwnership(
  definition: Pick<MissionCinematicDefinition, "mode" | "lockPlayerControl" | "lockCamera">
): { readonly lockControl: boolean; readonly lockCamera: boolean; readonly pauseSimulation: boolean } {
  return {
    lockControl: definition.lockPlayerControl ?? definition.mode !== "gameplay",
    lockCamera: definition.lockCamera ?? definition.mode !== "gameplay",
    pauseSimulation: definition.mode === "paused"
  };
}

export function campaignDialoguePresentationCategory(
  delivery: MissionDialogueLine["delivery"]
): CampaignPresentationCategory {
  if (delivery === "blocking") return "blocking-dialogue";
  if (delivery === "tutorial") return "tutorial";
  return "ambient";
}

export function campaignAudioCuePlayback(
  assetExists: boolean,
  audioServiceAvailable: boolean,
  waitForCompletion: boolean
): "skip" | "play-and-continue" | "play-and-wait" {
  if (!assetExists || !audioServiceAvailable) return "skip";
  return waitForCompletion ? "play-and-wait" : "play-and-continue";
}

export function campaignCameraCueTarget<T>(primary: T | undefined, fallback: T | undefined): T | undefined {
  return primary ?? fallback;
}

export class LocalCampaignSeenCinematicStore implements CampaignSeenCinematicStore {
  constructor(private readonly storage: Pick<Storage, "getItem" | "setItem"> | undefined = browserStorage()) {}

  hasSeen(campaignId: CampaignId, cinematicId: MissionCinematicDefinition["id"]): boolean {
    return this.read().has(`${campaignId}:${cinematicId}`);
  }

  markSeen(campaignId: CampaignId, cinematicId: MissionCinematicDefinition["id"]): void {
    const seen = this.read();
    seen.add(`${campaignId}:${cinematicId}`);
    try {
      this.storage?.setItem(SEEN_CINEMATICS_KEY, JSON.stringify([...seen].sort()));
    } catch {
      // Persistence is optional; the cinematic still completes when storage is unavailable.
    }
  }

  private read(): Set<string> {
    try {
      const value = JSON.parse(this.storage?.getItem(SEEN_CINEMATICS_KEY) ?? "[]");
      return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);
    } catch {
      return new Set();
    }
  }
}

function browserStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function emptyView(): CampaignCinematicViewState {
  return {
    active: false,
    canAcknowledge: false,
    letterbox: false,
    uiSuppressed: false,
    skipMode: "hold",
    skipProgress: 0,
    dialogueLog: []
  };
}

function ticksToMs(ticks: number): number {
  return ticks * SimulationTickService.TICK_INTERVAL_MS;
}

function safeResumeCueIndex(definition: MissionCinematicDefinition, cueIndex: number): number {
  return (
    [...(definition.resumeCueIndexes ?? [0])]
      .filter((candidate) => candidate <= cueIndex && candidate < definition.timeline.length)
      .sort((left, right) => right - left)[0] ?? 0
  );
}

function projectTransientLine(
  dialogue: MissionDialogueBundle,
  line: MissionDialogueLine,
  ownerToken: string
): CampaignDialogueLineProjection {
  const speaker = dialogue.speakers.find((candidate) => candidate.id === line.speakerId);
  const text = createMissionTextResolver(dialogue);
  const speakerName = speaker ? text(speaker.nameTextId) : "Narrator";
  const portraitId = line.portraitId ?? speaker?.portraitId;
  const portrait = portraitId ? dialogue.portraits?.find((candidate) => candidate.id === portraitId) : undefined;
  return {
    lineId: line.id,
    ownerToken,
    speakerName,
    text: line.text || text(line.textId),
    delivery: line.delivery,
    ...(portrait ? { portrait } : {}),
    portraitFallback: speakerName,
    ...(line.audioAssetKey ? { audioAssetKey: line.audioAssetKey } : {})
  };
}
