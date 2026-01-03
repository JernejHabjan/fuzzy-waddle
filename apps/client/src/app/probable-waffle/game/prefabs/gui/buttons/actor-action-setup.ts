import type { TooltipInfo } from "../labels/tooltip-info";

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
  tooltipInfo?: TooltipInfo;
  // Optional shortcut label (e.g., "A", "M", "1")
  shortcut?: string;
};
