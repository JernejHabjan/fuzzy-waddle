/**
 * Public campaign domain API. The package is intentionally split so authored JSON
 * contracts and deterministic statecharts remain framework-free; Phaser, Angular,
 * NestJS, SQL, replay, and save adapters depend on this authority instead of owning
 * parallel campaign state.
 *
 * The current delivered scope covers content, deterministic runtime, scenario bindings,
 * actions, objectives, presentation, AI encounters, progression, persistence, replay,
 * profile UI, co-op extension points, validation, and the Dreams/Cyclops vertical
 * slices. Co-op gameplay, graphical authoring, mods, and archive tooling remain
 * deferred extension work rather than implicit runtime behavior.
 *
 * ```text
 * authored JSON -> schema + semantic validation -> deterministic runtime
 *                                               |              |
 * Phaser scenario index <--- stable references -+              +-> effects -> local HUD/cinematics
 *                                               |              |
 * profile/rewards <--- save/replay/hash/reconnect snapshot <---+
 * ```
 *
 * The flow intentionally has one-way authority boundaries: content never reaches a
 * scene without validation, local presentation never writes mission state, and durable
 * profile rewards are committed only after an eligible deterministic outcome.
 *
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/700
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/701
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/702
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/703
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/704
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/705
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/706
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/707
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/708
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/709
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/710
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/711
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/712
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/713
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/714
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/715
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/716
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/717
 */
export * from "./lib/catalog/ashes-of-the-ancients-content";
export * from "./lib/catalog/ashes-of-the-ancients-progression";
export * from "./lib/catalog/build-campaign-catalog";
export * from "./lib/catalog/campaign-content-loader";
export * from "./lib/contracts/campaign-content-id";
export * from "./lib/contracts/campaign-content-kinds";
export * from "./lib/contracts/campaign-definition";
export * from "./lib/contracts/campaign-mission-content";
export * from "./lib/contracts/campaign-progression-definition";
export * from "./lib/contracts/mission-action-definition";
export * from "./lib/contracts/mission-checkpoint-definition";
export * from "./lib/contracts/mission-condition-definition";
export * from "./lib/contracts/mission-coop-override";
export * from "./lib/contracts/mission-dialogue-bundle";
export * from "./lib/contracts/mission-difficulty-definition";
export * from "./lib/contracts/mission-encounter-definition";
export * from "./lib/contracts/mission-objective-definition";
export * from "./lib/contracts/mission-participant-definition";
export * from "./lib/contracts/mission-phase-definition";
export * from "./lib/contracts/mission-progression-allowance";
export * from "./lib/contracts/mission-reward-bundle";
export * from "./lib/contracts/mission-runtime-initial-state";
export * from "./lib/contracts/mission-revision-migration";
export * from "./lib/contracts/mission-scenario-references";
export * from "./lib/contracts/mission-trigger-definition";
export * from "./lib/registry/campaign-content-registry";
export * from "./lib/registry/campaign-definition-registries";
export * from "./lib/registry/campaign-kind-registry";
export * from "./lib/registry/campaign-progression-registry";
export * from "./lib/registry/campaign-registry-registration";
export * from "./lib/registry/static-campaign-content-registry";
export * from "./lib/registry/trusted-campaign-hook-registration";
export * from "./lib/runtime/campaign-mission-runtime";
export * from "./lib/runtime/campaign-mission-save-migration";
export * from "./lib/runtime/campaign-content-allowance-service";
export * from "./lib/runtime/campaign-coop-policy";
export * from "./lib/runtime/campaign-host-coordination";
export * from "./lib/runtime/campaign-difficulty-resolver";
export * from "./lib/runtime/campaign-participant-resolver";
export * from "./lib/runtime/actions/campaign-action-runtime";
export * from "./lib/runtime/conditions/campaign-condition-evaluator";
export * from "./lib/runtime/encounters/campaign-encounter-service";
export * from "./lib/runtime/objectives/campaign-objective-service";
export * from "./lib/progression/campaign-progression-resolver";
export * from "./lib/progression/campaign-profile";
export * from "./lib/progression/campaign-reward-commit-service";
export * from "./lib/progression/campaign-run-integrity-service";
export * from "./lib/tooling/campaign-diagnostics-service";
export * from "./lib/tooling/campaign-mission-test-harness";
export * from "./lib/presentation/campaign-input-prompt-registry";
export * from "./lib/presentation/campaign-cinematic-presentation-service";
export * from "./lib/presentation/campaign-dialogue-projection";
export * from "./lib/presentation/campaign-objective-projection";
export * from "./lib/presentation/campaign-reward-summary-projection";
export * from "./lib/presentation/campaign-presentation-priority-queue";
export * from "./lib/validation/campaign-validation-issue";
export * from "./lib/validation/validate-campaign-content";
export * from "./lib/validation/validate-mission-scenario-references";
