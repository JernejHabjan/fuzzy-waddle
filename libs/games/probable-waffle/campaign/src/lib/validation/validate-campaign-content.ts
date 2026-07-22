import {
  CAMPAIGN_LOCAL_PRESENTATION_EVENT_KINDS,
  CAMPAIGN_MISSION_IDS,
  ObjectNames,
  ResearchType,
  type CampaignMissionId
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignDefinition } from "../contracts/campaign-definition";
import type { CampaignMissionContent } from "../contracts/campaign-mission-content";
import type { MissionActionDefinition } from "../contracts/mission-action-definition";
import type { MissionConditionDefinition } from "../contracts/mission-condition-definition";
import type { MissionDialogueBundle } from "../contracts/mission-dialogue-bundle";
import type { MissionRewardBundle } from "../contracts/mission-reward-bundle";
import type { CampaignDefinitionRegistries } from "../registry/campaign-definition-registries";
import type { CampaignValidationIssue, CampaignValidationResult } from "./campaign-validation-issue";
import { validateCampaignParticipants } from "../runtime/campaign-participant-resolver";

export interface CampaignValidationInput {
  readonly campaign: CampaignDefinition;
  readonly missions: readonly CampaignMissionContent[];
  readonly dialogue: readonly MissionDialogueBundle[];
  readonly rewards: readonly MissionRewardBundle[];
  readonly registries: CampaignDefinitionRegistries;
}

/** Performs full first-party semantic validation and is intentionally called only by tests/tooling. */
export function validateCampaignContent(input: CampaignValidationInput): CampaignValidationResult {
  const issues: CampaignValidationIssue[] = [];
  const missionById = uniqueBy(input.missions, (mission) => mission.id, "missions", "duplicate-mission-id", issues);
  const dialogueById = uniqueBy(
    input.dialogue,
    (bundle) => bundle.missionId,
    "dialogue",
    "duplicate-dialogue-bundle",
    issues
  );
  const rewardsById = uniqueBy(
    input.rewards,
    (bundle) => bundle.missionId,
    "rewards",
    "duplicate-reward-bundle",
    issues
  );
  const catalogueOrder = input.campaign.chapters.flatMap((chapter) => chapter.missionIds);

  if (!sameValues(catalogueOrder, CAMPAIGN_MISSION_IDS)) {
    addIssue(
      issues,
      "campaign.json",
      "$.chapters",
      "catalogue-order",
      `Mission order must be ${CAMPAIGN_MISSION_IDS.join(" -> ")}`
    );
  }

  for (const chapter of input.campaign.chapters) {
    const duplicateIds = findDuplicates(chapter.missionIds);
    for (const missionId of duplicateIds) {
      addIssue(
        issues,
        "campaign.json",
        `$.chapters[${chapter.id}].missionIds`,
        "duplicate-chapter-mission",
        `Mission '${missionId}' appears more than once in chapter '${chapter.id}'`
      );
    }
    for (const missionId of chapter.missionIds) {
      const mission = missionById.get(missionId);
      if (!mission) {
        addIssue(
          issues,
          "campaign.json",
          `$.chapters[${chapter.id}].missionIds`,
          "missing-mission",
          `Mission '${missionId}' has no mission.json`
        );
      } else if (mission.chapterId !== chapter.id) {
        addIssue(
          issues,
          missionPath(mission.id),
          "$.chapterId",
          "chapter-mismatch",
          `Mission belongs to '${mission.chapterId}', but the catalogue places it in '${chapter.id}'`
        );
      }
    }
  }

  for (const [index, missionId] of CAMPAIGN_MISSION_IDS.entries()) {
    const mission = missionById.get(missionId);
    if (!mission) continue;
    const expectedPrerequisites: readonly CampaignMissionId[] = index === 0 ? [] : [CAMPAIGN_MISSION_IDS[index - 1]!];
    if (!sameValues(mission.prerequisites, expectedPrerequisites)) {
      addIssue(
        issues,
        missionPath(missionId),
        "$.prerequisites",
        "invalid-prerequisites",
        `Expected prerequisites [${expectedPrerequisites.join(", ")}]`
      );
    }
    if (!dialogueById.has(missionId)) {
      addIssue(issues, missionPath(missionId), "$", "missing-dialogue", "Mission has no dialogue.json");
    }
    if (!rewardsById.has(missionId)) {
      addIssue(issues, missionPath(missionId), "$", "missing-rewards", "Mission has no rewards.json");
    }
    const dialogue = dialogueById.get(missionId);
    validateMission(mission, dialogue, rewardsById.get(missionId), input.registries, issues);
    if (dialogue) validateDialogue(dialogue, mission, input.registries, issues);
  }

  validatePrerequisiteCycles(input.missions, issues);
  return { valid: issues.length === 0, issues };
}

function validateMission(
  mission: CampaignMissionContent,
  dialogue: MissionDialogueBundle | undefined,
  rewards: MissionRewardBundle | undefined,
  registries: CampaignDefinitionRegistries,
  issues: CampaignValidationIssue[]
): void {
  const sourcePath = missionPath(mission.id);
  const phaseIds = new Set(mission.phases.map((phase) => String(phase.id)));
  const objectiveIds = new Set(mission.objectives.map((objective) => String(objective.id)));
  const rewardIds = new Set((rewards?.rewards ?? []).map((reward) => String(reward.id)));
  const textIds = new Set([
    ...(dialogue?.texts ?? []).map((text) => String(text.id)),
    ...(dialogue?.lines ?? []).map((line) => String(line.textId))
  ]);
  const dialogueLineIds = new Set((dialogue?.lines ?? []).map((line) => String(line.id)));
  const cinematicIds = new Set((dialogue?.cinematics ?? []).map((cinematic) => String(cinematic.id)));
  const encounterIds = new Set((mission.encounters ?? []).map((encounter) => String(encounter.id)));
  reportDuplicates(
    (mission.revisionMigrations ?? []).map((migration) => String(migration.fromRevision)),
    sourcePath,
    "$.revisionMigrations",
    "duplicate-revision-migration",
    issues
  );
  for (const [migrationIndex, migration] of (mission.revisionMigrations ?? []).entries()) {
    if (migration.toRevision <= migration.fromRevision || migration.toRevision > mission.revision) {
      addIssue(
        issues,
        sourcePath,
        `$.revisionMigrations[${migrationIndex}].toRevision`,
        "invalid-revision-migration",
        `Revision migration ${migration.fromRevision} -> ${migration.toRevision} must advance toward current revision ${mission.revision}`
      );
    }
    for (const targetId of Object.values(migration.renamePhaseIds ?? {})) {
      if (!phaseIds.has(targetId)) {
        addIssue(issues, sourcePath, `$.revisionMigrations[${migrationIndex}].renamePhaseIds`, "missing-phase-reference", `Unknown target phase '${targetId}'`);
      }
    }
    for (const targetId of Object.values(migration.renameObjectiveIds ?? {})) {
      if (!objectiveIds.has(targetId)) {
        addIssue(issues, sourcePath, `$.revisionMigrations[${migrationIndex}].renameObjectiveIds`, "missing-objective-reference", `Unknown target objective '${targetId}'`);
      }
    }
  }
  for (const error of validateCampaignParticipants(mission.participants)) {
    addIssue(issues, sourcePath, "$.participants", "invalid-participant", error);
  }
  validateAllowanceConflicts(mission, sourcePath, issues);
  reportDuplicates(
    (mission.difficulty.playerCountOverrides ?? []).map((override) => String(override.playerCount)),
    sourcePath,
    "$.difficulty.playerCountOverrides",
    "duplicate-player-count-override",
    issues
  );
  reportDuplicates(
    mission.phases.map((phase) => String(phase.id)),
    sourcePath,
    "$.phases",
    "duplicate-phase-id",
    issues
  );
  reportDuplicates(
    (mission.encounters ?? []).map((encounter) => String(encounter.id)),
    sourcePath,
    "$.encounters",
    "duplicate-encounter-id",
    issues
  );
  reportDuplicates(
    mission.objectives.map((objective) => String(objective.id)),
    sourcePath,
    "$.objectives",
    "duplicate-objective-id",
    issues
  );
  reportDuplicates(
    mission.checkpoints.map((checkpoint) => String(checkpoint.id)),
    sourcePath,
    "$.checkpoints",
    "duplicate-checkpoint-id",
    issues
  );
  const actionEntries = collectMissionActionEntries(mission);
  for (const entry of actionEntries) {
    if (entry.action.kind === "discover-reward" && !rewardIds.has(String(entry.action.rewardId))) {
      addIssue(
        issues,
        sourcePath,
        `${entry.jsonPath}.rewardId`,
        "missing-reward-reference",
        `Unknown reward '${entry.action.rewardId}'`
      );
    }
    if (entry.action.kind === "set-encounter-state" && !encounterIds.has(String(entry.action.encounterId))) {
      addIssue(
        issues,
        sourcePath,
        `${entry.jsonPath}.encounterId`,
        "missing-encounter-reference",
        `Unknown encounter '${entry.action.encounterId}'`
      );
    }
    if (entry.action.kind === "set-ai-enabled" || entry.action.kind === "ai-directive") {
      const participant = mission.participants[entry.action.playerNumber - 1];
      const validController =
        entry.action.kind === "set-ai-enabled"
          ? participant?.controller === "full-ai"
          : participant?.controller === "full-ai" || participant?.controller === "scripted-ai";
      if (!validController) {
        addIssue(
          issues,
          sourcePath,
          `${entry.jsonPath}.playerNumber`,
          "invalid-ai-participant-reference",
          `Action '${entry.action.id}' targets player ${entry.action.playerNumber} without a compatible AI controller`
        );
      }
    }
    if (
      entry.action.kind === "ai-directive" &&
      entry.action.directive !== "stop" &&
      !entry.action.targetActorId &&
      !entry.action.targetPointId
    ) {
      addIssue(
        issues,
        sourcePath,
        entry.jsonPath,
        "invalid-ai-directive-target",
        `AI directive '${entry.action.id}' requires an actor or point target`
      );
    }
  }
  for (const entry of collectMissionConditionEntries(mission)) {
    if (entry.condition.kind === "encounter" && !encounterIds.has(String(entry.condition.encounterId))) {
      addIssue(
        issues,
        sourcePath,
        `${entry.jsonPath}.encounterId`,
        "missing-encounter-reference",
        `Unknown encounter '${entry.condition.encounterId}'`
      );
    }
  }
  validateObjectiveReferences(mission, actionEntries, sourcePath, issues);
  validatePresentationActionReferences(actionEntries, dialogueLineIds, cinematicIds, sourcePath, issues);
  for (const actionId of findDuplicates(actionEntries.map((entry) => String(entry.action.id)))) {
    const entry = actionEntries.find((candidate) => String(candidate.action.id) === actionId)!;
    addIssue(issues, sourcePath, entry.jsonPath, "duplicate-action-id", `Duplicate action id '${actionId}'`);
  }

  for (const phaseId of mission.initialState.activePhaseIds) {
    if (!phaseIds.has(String(phaseId))) {
      addIssue(
        issues,
        sourcePath,
        "$.initialState.activePhaseIds",
        "missing-phase-reference",
        `Unknown phase '${phaseId}'`
      );
    }
  }
  for (const [phaseIndex, phase] of mission.phases.entries()) {
    const phasePath = `$.phases[${phaseIndex}]`;
    validateActions(phase.entryActions, sourcePath, `${phasePath}.entryActions`, registries, issues);
    validateActions(phase.exitActions, sourcePath, `${phasePath}.exitActions`, registries, issues);
    for (const [triggerIndex, trigger] of phase.triggers.entries()) {
      const triggerPath = `${phasePath}.triggers[${triggerIndex}]`;
      if (!registries.triggers.has(trigger.kind)) {
        addIssue(
          issues,
          sourcePath,
          `${triggerPath}.kind`,
          "missing-trigger-kind",
          `Unknown trigger kind '${trigger.kind}'`
        );
      }
      for (const eventKind of trigger.eventKinds ?? []) {
        if ((CAMPAIGN_LOCAL_PRESENTATION_EVENT_KINDS as readonly string[]).includes(eventKind)) {
          addIssue(
            issues,
            sourcePath,
            `${triggerPath}.eventKinds`,
            "local-presentation-event-trigger",
            `Local presentation event '${eventKind}' cannot drive deterministic mission actions`
          );
        }
      }
      validateCondition(trigger.condition, sourcePath, `${triggerPath}.condition`, registries, issues);
      validateActions(trigger.actions, sourcePath, `${triggerPath}.actions`, registries, issues);
    }
    for (const [transitionIndex, transition] of phase.transitions.entries()) {
      const transitionPath = `${phasePath}.transitions[${transitionIndex}]`;
      for (const targetId of transition.targetPhaseIds) {
        if (!phaseIds.has(String(targetId))) {
          addIssue(
            issues,
            sourcePath,
            `${transitionPath}.targetPhaseIds`,
            "missing-phase-reference",
            `Unknown phase '${targetId}'`
          );
        }
      }
      validateCondition(transition.condition, sourcePath, `${transitionPath}.condition`, registries, issues);
      validateActions(transition.actions, sourcePath, `${transitionPath}.actions`, registries, issues);
    }
  }
  for (const [objectiveIndex, objective] of mission.objectives.entries()) {
    const objectivePath = `$.objectives[${objectiveIndex}]`;
    if (!registries.objectives.has(objective.kind)) {
      addIssue(
        issues,
        sourcePath,
        `${objectivePath}.kind`,
        "missing-objective-kind",
        `Unknown objective kind '${objective.kind}'`
      );
    }
    validateCondition(objective.reveal, sourcePath, `${objectivePath}.reveal`, registries, issues);
    validateCondition(objective.complete, sourcePath, `${objectivePath}.complete`, registries, issues);
    if (objective.fail) validateCondition(objective.fail, sourcePath, `${objectivePath}.fail`, registries, issues);
    if (objective.impossible) {
      validateCondition(objective.impossible, sourcePath, `${objectivePath}.impossible`, registries, issues);
    }
    reportDuplicates(
      (objective.checklist ?? []).map((checklist) => String(checklist.id)),
      sourcePath,
      `${objectivePath}.checklist`,
      "duplicate-objective-checklist-id",
      issues
    );
    validateObjectiveTextReference(objective.titleTextId, `${objectivePath}.titleTextId`, textIds, sourcePath, issues);
    if (objective.descriptionTextId) {
      validateObjectiveTextReference(
        objective.descriptionTextId,
        `${objectivePath}.descriptionTextId`,
        textIds,
        sourcePath,
        issues
      );
    }
    for (const [checklistIndex, checklist] of (objective.checklist ?? []).entries()) {
      validateCondition(
        checklist.complete,
        sourcePath,
        `${objectivePath}.checklist[${checklistIndex}].complete`,
        registries,
        issues
      );
      validateObjectiveTextReference(
        checklist.textId,
        `${objectivePath}.checklist[${checklistIndex}].textId`,
        textIds,
        sourcePath,
        issues
      );
    }
    for (const dependencyId of objective.dependsOnObjectiveIds ?? []) {
      if (!objectiveIds.has(String(dependencyId))) {
        addIssue(
          issues,
          sourcePath,
          `${objectivePath}.dependsOnObjectiveIds`,
          "missing-objective-reference",
          `Unknown objective '${dependencyId}'`
        );
      }
    }
    for (const [field, lineId] of Object.entries(objective.display.narration ?? {})) {
      if (!dialogueLineIds.has(String(lineId))) {
        addIssue(
          issues,
          sourcePath,
          `${objectivePath}.display.narration.${field}`,
          "missing-dialogue-reference",
          `Unknown line '${lineId}'`
        );
      }
    }
    for (const rewardId of objective.rewardIds ?? []) {
      if (!rewardIds.has(String(rewardId))) {
        addIssue(
          issues,
          sourcePath,
          `${objectivePath}.rewardIds`,
          "missing-reward-reference",
          `Unknown reward '${rewardId}'`
        );
      }
    }
  }
  for (const [encounterIndex, encounter] of (mission.encounters ?? []).entries()) {
    const encounterPath = `$.encounters[${encounterIndex}]`;
    validateCondition(encounter.start, sourcePath, `${encounterPath}.start`, registries, issues);
    if (encounter.completion) {
      validateCondition(encounter.completion, sourcePath, `${encounterPath}.completion`, registries, issues);
    }
    reportDuplicates(
      encounter.waves.map((wave) => String(wave.id)),
      sourcePath,
      `${encounterPath}.waves`,
      "duplicate-encounter-wave-id",
      issues
    );
    reportDuplicates(
      (encounter.playerCountOverrides ?? []).map((override) => String(override.playerCount)),
      sourcePath,
      `${encounterPath}.playerCountOverrides`,
      "duplicate-player-count-override",
      issues
    );
    for (const [waveIndex, wave] of encounter.waves.entries()) {
      validateEncounterWave(mission, wave, sourcePath, `${encounterPath}.waves[${waveIndex}]`, registries, issues);
    }
    for (const [difficulty, override] of Object.entries(encounter.difficultyOverrides ?? {})) {
      for (const [waveIndex, wave] of (override.waves ?? []).entries()) {
        validateEncounterWave(
          mission,
          wave,
          sourcePath,
          `${encounterPath}.difficultyOverrides.${difficulty}.waves[${waveIndex}]`,
          registries,
          issues
        );
      }
    }
    for (const [overrideIndex, override] of (encounter.playerCountOverrides ?? []).entries()) {
      for (const [waveIndex, wave] of (override.waves ?? []).entries()) {
        validateEncounterWave(
          mission,
          wave,
          sourcePath,
          `${encounterPath}.playerCountOverrides[${overrideIndex}].waves[${waveIndex}]`,
          registries,
          issues
        );
      }
    }
  }
  validateObjectiveDependencyCycles(mission, issues);
  for (const [checkpointIndex, checkpoint] of mission.checkpoints.entries()) {
    const checkpointPath = `$.checkpoints[${checkpointIndex}]`;
    validateObjectiveTextReference(checkpoint.titleTextId, `${checkpointPath}.titleTextId`, textIds, sourcePath, issues);
    validateCondition(checkpoint.trigger, sourcePath, `${checkpointPath}.trigger`, registries, issues);
    validateActions(checkpoint.requiredActions, sourcePath, `${checkpointPath}.requiredActions`, registries, issues);
    validateActions(
      checkpoint.retryCleanupActions ?? [],
      sourcePath,
      `${checkpointPath}.retryCleanupActions`,
      registries,
      issues
    );
    if (checkpoint.resumePresentation?.textId) {
      validateObjectiveTextReference(
        checkpoint.resumePresentation.textId,
        `${checkpointPath}.resumePresentation.textId`,
        textIds,
        sourcePath,
        issues
      );
    }
    if (
      checkpoint.resumePresentation?.cinematicId &&
      !cinematicIds.has(String(checkpoint.resumePresentation.cinematicId))
    ) {
      addIssue(
        issues,
        sourcePath,
        `${checkpointPath}.resumePresentation.cinematicId`,
        "missing-cinematic-reference",
        `Unknown cinematic '${checkpoint.resumePresentation.cinematicId}'`
      );
    }
  }
  for (const [rewardIndex, reward] of (rewards?.rewards ?? []).entries()) {
    const rewardPath = `$.rewards[${rewardIndex}]`;
    if (!registries.rewards.has(reward.kind)) {
      addIssue(
        issues,
        rewardsPath(mission.id),
        `$.rewards[${rewardIndex}].kind`,
        "missing-reward-kind",
        `Unknown reward kind '${reward.kind}'`
      );
    }
    validateObjectiveTextReference(reward.titleTextId, `${rewardPath}.titleTextId`, textIds, rewardsPath(mission.id), issues);
    for (const objectiveId of reward.objectiveIds ?? []) {
      if (!objectiveIds.has(String(objectiveId))) {
        addIssue(
          issues,
          rewardsPath(mission.id),
          `${rewardPath}.objectiveIds`,
          "missing-objective-reference",
          `Unknown objective '${objectiveId}'`
        );
      }
    }
  }
  reportDuplicates(
    (rewards?.rewards ?? []).map((reward) => String(reward.id)),
    rewardsPath(mission.id),
    "$.rewards",
    "duplicate-reward-id",
    issues
  );
}

function validateObjectiveTextReference(
  textId: string,
  jsonPath: string,
  textIds: ReadonlySet<string>,
  sourcePath: string,
  issues: CampaignValidationIssue[]
): void {
  if (textIds.has(String(textId))) return;
  addIssue(issues, sourcePath, jsonPath, "missing-text-reference", `Unknown mission text '${textId}'`);
}

function validateObjectiveDependencyCycles(mission: CampaignMissionContent, issues: CampaignValidationIssue[]): void {
  const dependencies = new Map(
    mission.objectives.map((objective) => [String(objective.id), (objective.dependsOnObjectiveIds ?? []).map(String)])
  );
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const visit = (objectiveId: string): void => {
    if (visited.has(objectiveId)) return;
    if (visiting.has(objectiveId)) {
      addIssue(
        issues,
        missionPath(mission.id),
        "$.objectives",
        "objective-dependency-cycle",
        `Objective dependency cycle includes '${objectiveId}'`
      );
      return;
    }
    visiting.add(objectiveId);
    for (const dependencyId of dependencies.get(objectiveId) ?? []) visit(dependencyId);
    visiting.delete(objectiveId);
    visited.add(objectiveId);
  };
  for (const objectiveId of [...dependencies.keys()].sort()) visit(objectiveId);
}

function validateDialogue(
  dialogue: MissionDialogueBundle,
  mission: CampaignMissionContent,
  registries: CampaignDefinitionRegistries,
  issues: CampaignValidationIssue[]
): void {
  const sourcePath = dialoguePath(mission.id);
  const speakerIds = new Set(dialogue.speakers.map((speaker) => String(speaker.id)));
  const lineIds = new Set(dialogue.lines.map((line) => String(line.id)));
  const portraitIds = new Set((dialogue.portraits ?? []).map((portrait) => String(portrait.id)));
  const textIds = new Set([
    ...(dialogue.texts ?? []).map((text) => String(text.id)),
    ...dialogue.lines.map((line) => String(line.textId))
  ]);
  const actionIds = collectActionIds(mission);
  const dialogueActionEntries = collectDialogueActionEntries(dialogue);
  validateObjectiveReferences(mission, dialogueActionEntries, sourcePath, issues);
  validatePresentationActionReferences(
    dialogueActionEntries,
    lineIds,
    new Set(dialogue.cinematics.map((item) => String(item.id))),
    sourcePath,
    issues
  );
  for (const actionId of findDuplicates([
    ...collectMissionActionEntries(mission).map((entry) => String(entry.action.id)),
    ...dialogueActionEntries.map((entry) => String(entry.action.id))
  ])) {
    const entry = dialogueActionEntries.find((candidate) => String(candidate.action.id) === actionId);
    if (entry) addIssue(issues, sourcePath, entry.jsonPath, "duplicate-action-id", `Duplicate action id '${actionId}'`);
  }
  reportDuplicates(
    (dialogue.texts ?? []).map((text) => String(text.id)),
    sourcePath,
    "$.texts",
    "duplicate-text-id",
    issues
  );
  reportDuplicates(
    (dialogue.portraits ?? []).map((portrait) => String(portrait.id)),
    sourcePath,
    "$.portraits",
    "duplicate-portrait-id",
    issues
  );
  reportDuplicates(
    dialogue.speakers.map((speaker) => String(speaker.id)),
    sourcePath,
    "$.speakers",
    "duplicate-speaker-id",
    issues
  );
  reportDuplicates(
    dialogue.lines.map((line) => String(line.id)),
    sourcePath,
    "$.lines",
    "duplicate-dialogue-line-id",
    issues
  );
  reportDuplicates(
    dialogue.cinematics.map((cinematic) => String(cinematic.id)),
    sourcePath,
    "$.cinematics",
    "duplicate-cinematic-id",
    issues
  );
  for (const [lineIndex, line] of dialogue.lines.entries()) {
    if (!speakerIds.has(String(line.speakerId))) {
      addIssue(
        issues,
        sourcePath,
        `$.lines[${lineIndex}].speakerId`,
        "missing-speaker-reference",
        `Unknown speaker '${line.speakerId}'`
      );
    }
    if (line.portraitId && !portraitIds.has(String(line.portraitId))) {
      addIssue(
        issues,
        sourcePath,
        `$.lines[${lineIndex}].portraitId`,
        "missing-portrait-reference",
        `Unknown portrait '${line.portraitId}'`
      );
    }
  }
  for (const [speakerIndex, speaker] of dialogue.speakers.entries()) {
    if (!textIds.has(String(speaker.nameTextId))) {
      addIssue(
        issues,
        sourcePath,
        `$.speakers[${speakerIndex}].nameTextId`,
        "missing-text-reference",
        `Unknown mission text '${speaker.nameTextId}'`
      );
    }
    if (speaker.portraitId && !portraitIds.has(String(speaker.portraitId))) {
      addIssue(
        issues,
        sourcePath,
        `$.speakers[${speakerIndex}].portraitId`,
        "missing-portrait-reference",
        `Unknown portrait '${speaker.portraitId}'`
      );
    }
  }
  for (const [cinematicIndex, cinematic] of dialogue.cinematics.entries()) {
    const cinematicPath = `$.cinematics[${cinematicIndex}]`;
    validateActions(
      cinematic.gameplayPrelude ?? [],
      sourcePath,
      `${cinematicPath}.gameplayPrelude`,
      registries,
      issues
    );
    validateActions(
      cinematic.gameplayFinalize ?? [],
      sourcePath,
      `${cinematicPath}.gameplayFinalize`,
      registries,
      issues
    );
    if (!registries.cinematics.has(cinematic.mode)) {
      addIssue(
        issues,
        sourcePath,
        `${cinematicPath}.mode`,
        "missing-cinematic-kind",
        `Unknown cinematic mode '${cinematic.mode}'`
      );
    }
    for (const [cueIndex, cue] of cinematic.timeline.entries()) {
      if (cue.kind === "dialogue" && !lineIds.has(String(cue.lineId))) {
        addIssue(
          issues,
          sourcePath,
          `${cinematicPath}.timeline[${cueIndex}].lineId`,
          "missing-dialogue-reference",
          `Unknown line '${cue.lineId}'`
        );
      }
      if (cue.kind === "title" && !textIds.has(String(cue.textId))) {
        addIssue(
          issues,
          sourcePath,
          `${cinematicPath}.timeline[${cueIndex}].textId`,
          "missing-text-reference",
          `Unknown mission text '${cue.textId}'`
        );
      }
      if (cue.kind === "camera-shot") {
        validateDeclaredScenarioReference(
          mission,
          "cameraShots",
          cue.shotId,
          sourcePath,
          `${cinematicPath}.timeline[${cueIndex}].shotId`,
          issues
        );
        if (cue.fallbackPointId) {
          validateDeclaredScenarioReference(
            mission,
            "points",
            cue.fallbackPointId,
            sourcePath,
            `${cinematicPath}.timeline[${cueIndex}].fallbackPointId`,
            issues
          );
        }
      }
      if (cue.kind === "camera-actor" || cue.kind === "actor-animation") {
        validateDeclaredScenarioReference(
          mission,
          "actors",
          cue.actorId,
          sourcePath,
          `${cinematicPath}.timeline[${cueIndex}].actorId`,
          issues
        );
        if (cue.kind === "camera-actor" && cue.fallbackPointId) {
          validateDeclaredScenarioReference(
            mission,
            "points",
            cue.fallbackPointId,
            sourcePath,
            `${cinematicPath}.timeline[${cueIndex}].fallbackPointId`,
            issues
          );
        }
      }
    }
    for (const resumeCueIndex of cinematic.resumeCueIndexes ?? []) {
      if (resumeCueIndex >= cinematic.timeline.length) {
        addIssue(
          issues,
          sourcePath,
          `${cinematicPath}.resumeCueIndexes`,
          "invalid-cinematic-resume-cue",
          `Resume cue ${resumeCueIndex} is outside the ${cinematic.timeline.length}-cue timeline`
        );
      }
    }
    for (const actionId of [
      ...(cinematic.gameplayPreludeActionIds ?? []),
      ...(cinematic.gameplayFinalizeActionIds ?? [])
    ]) {
      if (!actionIds.has(String(actionId))) {
        addIssue(issues, sourcePath, cinematicPath, "missing-action-reference", `Unknown action '${actionId}'`);
      }
    }
  }
  validateCinematicActionCycles(dialogue, mission, sourcePath, issues);
}

function validateDeclaredScenarioReference(
  mission: CampaignMissionContent,
  kind: "actors" | "points" | "cameraShots" | "spawnSets",
  id: string,
  sourcePath: string,
  jsonPath: string,
  issues: CampaignValidationIssue[]
): void {
  if ((mission.scenarioReferences?.[kind] ?? []).some((candidate) => String(candidate) === String(id))) return;
  addIssue(
    issues,
    sourcePath,
    jsonPath,
    "missing-scenario-reference",
    `Mission does not declare ${kind} scenario reference '${id}'`
  );
}

function validateCinematicActionCycles(
  dialogue: MissionDialogueBundle,
  mission: CampaignMissionContent,
  sourcePath: string,
  issues: CampaignValidationIssue[]
): void {
  const actionsById = new Map(
    collectMissionActionEntries(mission).map((entry) => [String(entry.action.id), entry.action])
  );
  const dependencies = new Map<string, string[]>();
  const collectCinematics = (action: MissionActionDefinition): string[] => {
    const result = action.kind === "start-cinematic" ? [String(action.cinematicId)] : [];
    if (action.kind === "sequence" || action.kind === "parallel" || action.kind === "race") {
      for (const child of action.actions) result.push(...collectCinematics(child));
    }
    if (action.fallbackAction) result.push(...collectCinematics(action.fallbackAction));
    return result;
  };
  for (const cinematic of dialogue.cinematics) {
    const actionIds = [...(cinematic.gameplayPreludeActionIds ?? []), ...(cinematic.gameplayFinalizeActionIds ?? [])];
    const inlineActions = [...(cinematic.gameplayPrelude ?? []), ...(cinematic.gameplayFinalize ?? [])];
    dependencies.set(String(cinematic.id), [
      ...inlineActions.flatMap(collectCinematics),
      ...actionIds.flatMap((actionId) => {
        const action = actionsById.get(String(actionId));
        return action ? collectCinematics(action) : [];
      })
    ]);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const visit = (cinematicId: string): void => {
    if (visited.has(cinematicId)) return;
    if (visiting.has(cinematicId)) {
      addIssue(
        issues,
        sourcePath,
        "$.cinematics",
        "cinematic-action-cycle",
        `Cinematic action cycle includes '${cinematicId}'`
      );
      return;
    }
    visiting.add(cinematicId);
    for (const dependencyId of dependencies.get(cinematicId) ?? []) visit(dependencyId);
    visiting.delete(cinematicId);
    visited.add(cinematicId);
  };
  for (const cinematicId of [...dependencies.keys()].sort()) visit(cinematicId);
}

function validatePresentationActionReferences(
  actionEntries: readonly { readonly action: MissionActionDefinition; readonly jsonPath: string }[],
  dialogueLineIds: ReadonlySet<string>,
  cinematicIds: ReadonlySet<string>,
  sourcePath: string,
  issues: CampaignValidationIssue[]
): void {
  for (const entry of actionEntries) {
    const action = entry.action;
    if (
      (action.kind === "start-dialogue" || action.kind === "set-dialogue-state") &&
      !dialogueLineIds.has(String(action.lineId))
    ) {
      addIssue(
        issues,
        sourcePath,
        `${entry.jsonPath}.lineId`,
        "missing-dialogue-reference",
        `Unknown line '${action.lineId}'`
      );
    }
    if (
      (action.kind === "start-cinematic" || action.kind === "set-cinematic-stage") &&
      !cinematicIds.has(String(action.cinematicId))
    ) {
      addIssue(
        issues,
        sourcePath,
        `${entry.jsonPath}.cinematicId`,
        "missing-cinematic-reference",
        `Unknown cinematic '${action.cinematicId}'`
      );
    }
  }
}

function validateActions(
  actions: readonly MissionActionDefinition[],
  sourcePath: string,
  jsonPath: string,
  registries: CampaignDefinitionRegistries,
  issues: CampaignValidationIssue[]
): void {
  for (const [index, action] of actions.entries()) {
    if (!registries.actions.has(action.kind)) {
      addIssue(
        issues,
        sourcePath,
        `${jsonPath}[${index}].kind`,
        "missing-action-kind",
        `Unknown action kind '${action.kind}'`
      );
    }
    if (action.kind === "trusted-hook" && !registries.trustedHooks.has(action.hookId)) {
      addIssue(
        issues,
        sourcePath,
        `${jsonPath}[${index}].hookId`,
        "missing-trusted-hook",
        `Unknown trusted hook '${action.hookId}'`
      );
    }
    if (action.kind === "ai-directive" && !registries.aiDirectives.has(action.directive)) {
      addIssue(
        issues,
        sourcePath,
        `${jsonPath}[${index}].directive`,
        "missing-ai-directive-kind",
        `Unknown AI directive '${action.directive}'`
      );
    }
    if (action.missingReferencePolicy === "fallback" && !action.fallbackAction) {
      addIssue(
        issues,
        sourcePath,
        `${jsonPath}[${index}].fallbackAction`,
        "missing-fallback-action",
        `Action '${action.id}' declares fallback policy without a fallback action`
      );
    }
    if (action.fallbackAction) {
      validateActions([action.fallbackAction], sourcePath, `${jsonPath}[${index}].fallbackAction`, registries, issues);
    }
    if (action.kind === "sequence" || action.kind === "parallel" || action.kind === "race") {
      validateActions(action.actions, sourcePath, `${jsonPath}[${index}].actions`, registries, issues);
    }
  }
}

function validateCondition(
  condition: MissionConditionDefinition,
  sourcePath: string,
  jsonPath: string,
  registries: CampaignDefinitionRegistries,
  issues: CampaignValidationIssue[]
): void {
  if (!registries.conditions.has(condition.kind)) {
    addIssue(
      issues,
      sourcePath,
      `${jsonPath}.kind`,
      "missing-condition-kind",
      `Unknown condition kind '${condition.kind}'`
    );
  }
  if (condition.kind === "all" || condition.kind === "any") {
    for (const [index, child] of condition.conditions.entries()) {
      validateCondition(child, sourcePath, `${jsonPath}.conditions[${index}]`, registries, issues);
    }
  } else if (condition.kind === "not") {
    validateCondition(condition.condition, sourcePath, `${jsonPath}.condition`, registries, issues);
  }
}

function validatePrerequisiteCycles(
  missions: readonly CampaignMissionContent[],
  issues: CampaignValidationIssue[]
): void {
  const prerequisites = new Map(missions.map((mission) => [mission.id, mission.prerequisites]));
  const visiting = new Set<CampaignMissionId>();
  const visited = new Set<CampaignMissionId>();
  const visit = (missionId: CampaignMissionId): boolean => {
    if (visiting.has(missionId)) return true;
    if (visited.has(missionId)) return false;
    visiting.add(missionId);
    for (const prerequisite of prerequisites.get(missionId) ?? []) {
      if (visit(prerequisite)) return true;
    }
    visiting.delete(missionId);
    visited.add(missionId);
    return false;
  };
  for (const mission of missions) {
    visiting.clear();
    if (visit(mission.id)) {
      addIssue(
        issues,
        missionPath(mission.id),
        "$.prerequisites",
        "prerequisite-cycle",
        `Mission '${mission.id}' participates in a prerequisite cycle`
      );
    }
  }
}

function collectActionIds(mission: CampaignMissionContent): Set<string> {
  return new Set(collectMissionActionEntries(mission).map((entry) => String(entry.action.id)));
}

function validateObjectiveReferences(
  mission: CampaignMissionContent,
  actionEntries: readonly { readonly action: MissionActionDefinition; readonly jsonPath: string }[],
  sourcePath: string,
  issues: CampaignValidationIssue[]
): void {
  const checklistIdsByObjective = new Map(
    mission.objectives.map((objective) => [
      String(objective.id),
      new Set((objective.checklist ?? []).map((checklist) => String(checklist.id)))
    ])
  );
  const validateReference = (objectiveId: string, checklistId: string | undefined, jsonPath: string): void => {
    const checklistIds = checklistIdsByObjective.get(objectiveId);
    if (!checklistIds) {
      addIssue(issues, sourcePath, jsonPath, "missing-objective-reference", `Unknown objective '${objectiveId}'`);
      return;
    }
    if (checklistId !== undefined && !checklistIds.has(checklistId)) {
      addIssue(
        issues,
        sourcePath,
        jsonPath,
        "missing-objective-checklist-reference",
        `Unknown objective checklist '${objectiveId}/${checklistId}'`
      );
    }
  };
  for (const { action, jsonPath } of actionEntries) {
    if (action.kind === "set-objective-state")
      validateReference(action.objectiveId, undefined, `${jsonPath}.objectiveId`);
    if (action.kind === "set-objective-checklist-state") {
      validateReference(action.objectiveId, action.checklistId, `${jsonPath}.checklistId`);
    }
  }
  for (const { condition, jsonPath } of collectMissionConditionEntries(mission)) {
    if (condition.kind === "objective") validateReference(condition.objectiveId, undefined, `${jsonPath}.objectiveId`);
    if (condition.kind === "objective-checklist") {
      validateReference(condition.objectiveId, condition.checklistId, `${jsonPath}.checklistId`);
    }
  }
}

function collectMissionConditionEntries(
  mission: CampaignMissionContent
): { readonly condition: MissionConditionDefinition; readonly jsonPath: string }[] {
  const result: { condition: MissionConditionDefinition; jsonPath: string }[] = [];
  const addCondition = (condition: MissionConditionDefinition, jsonPath: string): void => {
    result.push({ condition, jsonPath });
    if (condition.kind === "all" || condition.kind === "any") {
      for (const [index, child] of condition.conditions.entries()) {
        addCondition(child, `${jsonPath}.conditions[${index}]`);
      }
    } else if (condition.kind === "not") addCondition(condition.condition, `${jsonPath}.condition`);
  };
  for (const [phaseIndex, phase] of mission.phases.entries()) {
    for (const [triggerIndex, trigger] of phase.triggers.entries()) {
      addCondition(trigger.condition, `$.phases[${phaseIndex}].triggers[${triggerIndex}].condition`);
    }
    for (const [transitionIndex, transition] of phase.transitions.entries()) {
      addCondition(transition.condition, `$.phases[${phaseIndex}].transitions[${transitionIndex}].condition`);
    }
  }
  for (const [objectiveIndex, objective] of mission.objectives.entries()) {
    const objectivePath = `$.objectives[${objectiveIndex}]`;
    addCondition(objective.reveal, `${objectivePath}.reveal`);
    addCondition(objective.complete, `${objectivePath}.complete`);
    if (objective.fail) addCondition(objective.fail, `${objectivePath}.fail`);
    if (objective.impossible) addCondition(objective.impossible, `${objectivePath}.impossible`);
    for (const [checklistIndex, checklist] of (objective.checklist ?? []).entries()) {
      addCondition(checklist.complete, `${objectivePath}.checklist[${checklistIndex}].complete`);
    }
  }
  for (const [checkpointIndex, checkpoint] of mission.checkpoints.entries()) {
    addCondition(checkpoint.trigger, `$.checkpoints[${checkpointIndex}].trigger`);
  }
  for (const [encounterIndex, encounter] of (mission.encounters ?? []).entries()) {
    addCondition(encounter.start, `$.encounters[${encounterIndex}].start`);
    if (encounter.completion) addCondition(encounter.completion, `$.encounters[${encounterIndex}].completion`);
  }
  return result;
}

function collectMissionActionEntries(
  mission: CampaignMissionContent
): { readonly action: MissionActionDefinition; readonly jsonPath: string }[] {
  const result: { action: MissionActionDefinition; jsonPath: string }[] = [];
  const addActions = (actions: readonly MissionActionDefinition[], jsonPath: string): void => {
    for (const [index, action] of actions.entries()) {
      const actionPath = `${jsonPath}[${index}]`;
      result.push({ action, jsonPath: actionPath });
      if (action.fallbackAction) addActions([action.fallbackAction], `${actionPath}.fallbackAction`);
      if (action.kind === "sequence" || action.kind === "parallel" || action.kind === "race") {
        addActions(action.actions, `${actionPath}.actions`);
      }
    }
  };
  for (const [phaseIndex, phase] of mission.phases.entries()) {
    addActions(phase.entryActions, `$.phases[${phaseIndex}].entryActions`);
    addActions(phase.exitActions, `$.phases[${phaseIndex}].exitActions`);
    for (const [triggerIndex, trigger] of phase.triggers.entries()) {
      addActions(trigger.actions, `$.phases[${phaseIndex}].triggers[${triggerIndex}].actions`);
    }
    for (const [transitionIndex, transition] of phase.transitions.entries()) {
      addActions(transition.actions, `$.phases[${phaseIndex}].transitions[${transitionIndex}].actions`);
    }
  }
  for (const [checkpointIndex, checkpoint] of mission.checkpoints.entries()) {
    addActions(checkpoint.requiredActions, `$.checkpoints[${checkpointIndex}].requiredActions`);
    addActions(checkpoint.retryCleanupActions ?? [], `$.checkpoints[${checkpointIndex}].retryCleanupActions`);
  }
  for (const [encounterIndex, encounter] of (mission.encounters ?? []).entries()) {
    const addWaves = (waves: typeof encounter.waves, jsonPath: string): void => {
      for (const [waveIndex, wave] of waves.entries()) {
        addActions(wave.actions ?? [], `${jsonPath}[${waveIndex}].actions`);
      }
    };
    addWaves(encounter.waves, `$.encounters[${encounterIndex}].waves`);
    for (const [difficulty, override] of Object.entries(encounter.difficultyOverrides ?? {})) {
      addWaves(override.waves ?? [], `$.encounters[${encounterIndex}].difficultyOverrides.${difficulty}.waves`);
    }
    for (const [overrideIndex, override] of (encounter.playerCountOverrides ?? []).entries()) {
      addWaves(override.waves ?? [], `$.encounters[${encounterIndex}].playerCountOverrides[${overrideIndex}].waves`);
    }
  }
  return result;
}

function validateEncounterWave(
  mission: CampaignMissionContent,
  wave: NonNullable<CampaignMissionContent["encounters"]>[number]["waves"][number],
  sourcePath: string,
  jsonPath: string,
  registries: CampaignDefinitionRegistries,
  issues: CampaignValidationIssue[]
): void {
  validateActions(wave.actions ?? [], sourcePath, `${jsonPath}.actions`, registries, issues);
  reportDuplicates(
    (wave.branches ?? []).map((branch) => String(branch.id)),
    sourcePath,
    `${jsonPath}.branches`,
    "duplicate-encounter-branch-id",
    issues
  );
  for (const [groupIndex, group] of [
    ...wave.spawns,
    ...(wave.branches ?? []).flatMap((branch) => branch.spawns)
  ].entries()) {
    const groupPath = `${jsonPath}.spawns[${groupIndex}]`;
    validateDeclaredScenarioReference(
      mission,
      "spawnSets",
      group.spawnSetId,
      sourcePath,
      `${groupPath}.spawnSetId`,
      issues
    );
    if (group.fallbackSpawnSetId) {
      validateDeclaredScenarioReference(
        mission,
        "spawnSets",
        group.fallbackSpawnSetId,
        sourcePath,
        `${groupPath}.fallbackSpawnSetId`,
        issues
      );
    } else if (wave.blockedSpawnPolicy === "fallback") {
      addIssue(
        issues,
        sourcePath,
        `${groupPath}.fallbackSpawnSetId`,
        "missing-encounter-fallback",
        `Wave '${wave.id}' requires a fallback spawn set`
      );
    }
    for (const [actorIndex, actor] of group.actors.entries()) {
      if (!Object.values(ObjectNames).includes(actor.actorName)) {
        addIssue(
          issues,
          sourcePath,
          `${groupPath}.actors[${actorIndex}].actorName`,
          "invalid-encounter-composition",
          `Unknown actor '${actor.actorName}'`
        );
      }
      if (
        actor.ownerPlayerNumber !== undefined &&
        (actor.ownerPlayerNumber < 1 || actor.ownerPlayerNumber > mission.participants.length)
      ) {
        addIssue(
          issues,
          sourcePath,
          `${groupPath}.actors[${actorIndex}].ownerPlayerNumber`,
          "invalid-encounter-owner",
          `Encounter actor targets missing player ${actor.ownerPlayerNumber}`
        );
      }
    }
  }
}

function validateAllowanceConflicts(
  mission: CampaignMissionContent,
  sourcePath: string,
  issues: CampaignValidationIssue[]
): void {
  const allowance = mission.progressionAllowance;
  for (const [allowed, denied, path] of [
    [allowance.allowedUnlockIds, allowance.deniedUnlockIds, "UnlockIds"],
    [allowance.allowedActorIds, allowance.deniedActorIds, "ActorIds"],
    [allowance.allowedResearchIds, allowance.deniedResearchIds, "ResearchIds"]
  ] as const) {
    const deniedValues = new Set((denied ?? []).map(String));
    for (const id of allowed ?? []) {
      if (deniedValues.has(String(id))) {
        addIssue(
          issues,
          sourcePath,
          `$.progressionAllowance.allowed${path}`,
          "conflicting-content-allowance",
          `Content '${id}' is both allowed and denied`
        );
      }
    }
  }
  for (const [values, validValues, path] of [
    [
      [...(allowance.allowedActorIds ?? []), ...(allowance.deniedActorIds ?? [])],
      Object.values(ObjectNames),
      "ActorIds"
    ],
    [
      [...(allowance.allowedResearchIds ?? []), ...(allowance.deniedResearchIds ?? [])],
      Object.values(ResearchType),
      "ResearchIds"
    ]
  ] as const) {
    for (const id of values) {
      if (!validValues.includes(id as never)) {
        addIssue(
          issues,
          sourcePath,
          `$.progressionAllowance.allowed${path}`,
          "invalid-content-allowance",
          `Unknown content '${id}'`
        );
      }
    }
  }
}

function collectDialogueActionEntries(
  dialogue: MissionDialogueBundle
): { readonly action: MissionActionDefinition; readonly jsonPath: string }[] {
  const result: { action: MissionActionDefinition; jsonPath: string }[] = [];
  const addActions = (actions: readonly MissionActionDefinition[], jsonPath: string): void => {
    for (const [index, action] of actions.entries()) {
      const actionPath = `${jsonPath}[${index}]`;
      result.push({ action, jsonPath: actionPath });
      if (action.fallbackAction) addActions([action.fallbackAction], `${actionPath}.fallbackAction`);
      if (action.kind === "sequence" || action.kind === "parallel" || action.kind === "race") {
        addActions(action.actions, `${actionPath}.actions`);
      }
    }
  };
  for (const [cinematicIndex, cinematic] of dialogue.cinematics.entries()) {
    addActions(cinematic.gameplayPrelude ?? [], `$.cinematics[${cinematicIndex}].gameplayPrelude`);
    addActions(cinematic.gameplayFinalize ?? [], `$.cinematics[${cinematicIndex}].gameplayFinalize`);
  }
  return result;
}

function uniqueBy<TKey extends string, TValue>(
  values: readonly TValue[],
  keyOf: (value: TValue) => TKey,
  sourcePath: string,
  code: string,
  issues: CampaignValidationIssue[]
): Map<TKey, TValue> {
  const result = new Map<TKey, TValue>();
  for (const value of values) {
    const key = keyOf(value);
    if (result.has(key)) addIssue(issues, sourcePath, "$", code, `Duplicate id '${key}'`);
    else result.set(key, value);
  }
  return result;
}

function reportDuplicates(
  values: readonly string[],
  sourcePath: string,
  jsonPath: string,
  code: string,
  issues: CampaignValidationIssue[]
): void {
  for (const value of findDuplicates(values)) addIssue(issues, sourcePath, jsonPath, code, `Duplicate id '${value}'`);
}

function findDuplicates<TValue>(values: readonly TValue[]): readonly TValue[] {
  const seen = new Set<TValue>();
  const duplicates = new Set<TValue>();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    else seen.add(value);
  }
  return [...duplicates];
}

function sameValues(left: readonly unknown[], right: readonly unknown[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function addIssue(
  issues: CampaignValidationIssue[],
  sourcePath: string,
  jsonPath: string,
  code: string,
  message: string
): void {
  issues.push({ sourcePath, jsonPath, code, message });
}

function missionPath(missionId: CampaignMissionId): string {
  return `content/ashes-of-the-ancients/missions/${missionId}/mission.json`;
}

function dialoguePath(missionId: CampaignMissionId): string {
  return `content/ashes-of-the-ancients/missions/${missionId}/dialogue.json`;
}

function rewardsPath(missionId: CampaignMissionId): string {
  return `content/ashes-of-the-ancients/missions/${missionId}/rewards.json`;
}
