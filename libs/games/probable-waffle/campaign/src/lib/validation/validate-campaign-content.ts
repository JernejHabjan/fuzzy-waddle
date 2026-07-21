import { CAMPAIGN_MISSION_IDS, type CampaignMissionId } from "@fuzzy-waddle/probable-waffle-protocol";
import type { CampaignDefinition } from "../contracts/campaign-definition";
import type { CampaignMissionContent } from "../contracts/campaign-mission-content";
import type { MissionActionDefinition } from "../contracts/mission-action-definition";
import type { MissionConditionDefinition } from "../contracts/mission-condition-definition";
import type { MissionDialogueBundle } from "../contracts/mission-dialogue-bundle";
import type { MissionRewardBundle } from "../contracts/mission-reward-bundle";
import type { CampaignDefinitionRegistries } from "../registry/campaign-definition-registries";
import type { CampaignValidationIssue, CampaignValidationResult } from "./campaign-validation-issue";

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
    validateMission(mission, rewardsById.get(missionId), input.registries, issues);
    const dialogue = dialogueById.get(missionId);
    if (dialogue) validateDialogue(dialogue, mission, input.registries, issues);
  }

  validatePrerequisiteCycles(input.missions, issues);
  return { valid: issues.length === 0, issues };
}

function validateMission(
  mission: CampaignMissionContent,
  rewards: MissionRewardBundle | undefined,
  registries: CampaignDefinitionRegistries,
  issues: CampaignValidationIssue[]
): void {
  const sourcePath = missionPath(mission.id);
  const phaseIds = new Set(mission.phases.map((phase) => String(phase.id)));
  const rewardIds = new Set((rewards?.rewards ?? []).map((reward) => String(reward.id)));
  reportDuplicates(
    mission.phases.map((phase) => String(phase.id)),
    sourcePath,
    "$.phases",
    "duplicate-phase-id",
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
      if (!registries.triggers.has(trigger.kind)) {
        addIssue(
          issues,
          sourcePath,
          `${phasePath}.triggers[${triggerIndex}].kind`,
          "missing-trigger-kind",
          `Unknown trigger kind '${trigger.kind}'`
        );
      }
      validateCondition(
        trigger.condition,
        sourcePath,
        `${phasePath}.triggers[${triggerIndex}].condition`,
        registries,
        issues
      );
      validateActions(
        trigger.actions,
        sourcePath,
        `${phasePath}.triggers[${triggerIndex}].actions`,
        registries,
        issues
      );
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
  for (const [checkpointIndex, checkpoint] of mission.checkpoints.entries()) {
    const checkpointPath = `$.checkpoints[${checkpointIndex}]`;
    validateCondition(checkpoint.trigger, sourcePath, `${checkpointPath}.trigger`, registries, issues);
    validateActions(checkpoint.requiredActions, sourcePath, `${checkpointPath}.requiredActions`, registries, issues);
  }
  for (const [rewardIndex, reward] of (rewards?.rewards ?? []).entries()) {
    if (!registries.rewards.has(reward.kind)) {
      addIssue(
        issues,
        rewardsPath(mission.id),
        `$.rewards[${rewardIndex}].kind`,
        "missing-reward-kind",
        `Unknown reward kind '${reward.kind}'`
      );
    }
  }
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
  const actionIds = collectActionIds(mission);
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
  }
  for (const [cinematicIndex, cinematic] of dialogue.cinematics.entries()) {
    const cinematicPath = `$.cinematics[${cinematicIndex}]`;
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
    }
    for (const actionId of [...(cinematic.gameplayPreludeActionIds ?? []), ...cinematic.gameplayFinalizeActionIds]) {
      if (!actionIds.has(String(actionId))) {
        addIssue(issues, sourcePath, cinematicPath, "missing-action-reference", `Unknown action '${actionId}'`);
      }
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
