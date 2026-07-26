import type { MissionSemanticInputAction } from "../contracts/mission-objective-definition";

/**
 * Defines the closed campaign input mode value set. Keeping this union named preserves exhaustive handling and
 * prevents incompatible free-form values at its boundaries.
 */
export type CampaignInputMode = "keyboard-mouse" | "touch";

/**
 * Defines the structured campaign input prompt registration contract for this module. Its declared surface
 * makes action, keyboard mouse, touch, collapsed explicit to every consumer. Use this shared shape rather than
 * an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignInputPromptRegistration {
  /**
   * action value carried by {@link CampaignInputPromptRegistration}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly action: MissionSemanticInputAction;
  /**
   * string keyboard mouse carried by {@link CampaignInputPromptRegistration}. Treat it according to the owning
   * contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly keyboardMouse: string;
  /**
   * string touch carried by {@link CampaignInputPromptRegistration}. Treat it according to the owning contract’s
   * validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly touch: string;
  /**
   * string collapsed carried by {@link CampaignInputPromptRegistration}. Treat it according to the owning
   * contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly collapsed: string;
}

/**
 * Defines the structured campaign input prompt presentation contract for this module. Its declared surface
 * makes action, mode, text, collapsed explicit to every consumer. Use this shared shape rather than an ad-hoc
 * object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignInputPromptPresentation {
  /**
   * action value carried by {@link CampaignInputPromptPresentation}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly action: MissionSemanticInputAction;
  /**
   * discriminator for {@link CampaignInputPromptPresentation}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly mode: CampaignInputMode;
  /**
   * human-facing text for {@link CampaignInputPromptPresentation}. It supports UI, narration, or diagnostics and
   * must not be used as the stable identity of the record.
   */
  readonly text: string;
  /**
   * collapsed value carried by {@link CampaignInputPromptPresentation}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
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
