import type { MissionSemanticInputAction } from "../contracts/mission-objective-definition";

export type CampaignInputMode = "keyboard-mouse" | "touch";

export interface CampaignInputPromptRegistration {
  readonly action: MissionSemanticInputAction;
  readonly keyboardMouse: string;
  readonly touch: string;
  readonly collapsed: string;
}

export interface CampaignInputPromptPresentation {
  readonly action: MissionSemanticInputAction;
  readonly mode: CampaignInputMode;
  readonly text: string;
  readonly collapsed: boolean;
}

export class CampaignInputPromptRegistry {
  private readonly registrations = new Map<MissionSemanticInputAction, CampaignInputPromptRegistration>();

  register(registration: CampaignInputPromptRegistration): void {
    if (this.registrations.has(registration.action)) {
      throw new Error(`Campaign input prompt '${registration.action}' is already registered`);
    }
    this.registrations.set(registration.action, registration);
  }

  resolve(
    action: MissionSemanticInputAction,
    mode: CampaignInputMode,
    collapsed = false
  ): CampaignInputPromptPresentation {
    const registration = this.registrations.get(action);
    if (!registration) throw new Error(`Campaign input prompt '${action}' is not registered`);
    return {
      action,
      mode,
      text: collapsed ? registration.collapsed : mode === "touch" ? registration.touch : registration.keyboardMouse,
      collapsed
    };
  }

  actions(): readonly MissionSemanticInputAction[] {
    return [...this.registrations.keys()].sort();
  }
}

export function createDefaultCampaignInputPromptRegistry(): CampaignInputPromptRegistry {
  const registry = new CampaignInputPromptRegistry();
  for (const registration of DEFAULT_CAMPAIGN_INPUT_PROMPTS) registry.register(registration);
  return registry;
}

export const DEFAULT_CAMPAIGN_INPUT_PROMPTS: readonly CampaignInputPromptRegistration[] = [
  {
    action: "camera.pan",
    keyboardMouse: "Pan the camera with the arrow keys or screen edge",
    touch: "Drag with one finger to pan the camera",
    collapsed: "Pan the camera"
  },
  {
    action: "selection.primary",
    keyboardMouse: "Left-click a unit to select it",
    touch: "Tap a unit to select it",
    collapsed: "Select a unit"
  },
  {
    action: "command.move",
    keyboardMouse: "Right-click the ground to move",
    touch: "Select Move, then tap the ground",
    collapsed: "Issue a move command"
  },
  {
    action: "command.attack",
    keyboardMouse: "Right-click an enemy to attack",
    touch: "Select Attack, then tap an enemy",
    collapsed: "Attack an enemy"
  },
  {
    action: "command.carry",
    keyboardMouse: "Use the carry action, then click the target",
    touch: "Tap Carry, then tap the target",
    collapsed: "Carry the target"
  },
  {
    action: "interaction.primary",
    keyboardMouse: "Select the unit and use its highlighted interaction",
    touch: "Select the unit and tap its highlighted interaction",
    collapsed: "Use the highlighted interaction"
  }
];
