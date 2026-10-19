import type { TooltipInfo } from "../labels/tooltip-info";
import type { SpellActionAvailability } from "./spell-action-availability";

export type ActorActionSetup = {
  icon?: {
    key: string;
    frame: string;
    origin?: {
      x: number;
      y: number;
    };
  };
  disabled?: boolean;
  visible: boolean;
  action?: () => void;
  onRightClick?: () => void;
  tooltipInfo?: TooltipInfo;
  // Optional shortcut label (e.g., "A", "M", "1")
  shortcut?: string;
  // Optional cooldown progress (0-100, undefined = no cooldown shown)
  cooldownProgress?: number;
  // Cooldown remaining time in milliseconds
  cooldownRemaining?: number;
  // Autocast indicator (for spells)
  autocastEnabled?: boolean;
  /** Explicit spell state; locked takes precedence over cooldown rendering. */
  availability?: SpellActionAvailability;
};
