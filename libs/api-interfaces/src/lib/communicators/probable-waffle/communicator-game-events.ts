import { ProbableWaffleCommunicatorEvent } from "./communicators";

export interface ProbableWaffleCommunicatorSelectionEvent extends ProbableWaffleCommunicatorEvent {
  type: "deselect" | "singleSelect" | "multiSelect" | "multiSelectPreview" | "terrainSelect";
  data?: {
    button: "left" | "right";
    selected?: string[];
    selectedArea?: { x: number; y: number; width: number; height: number };
    terrainSelected?: { x: number; y: number; z: number };
    shiftKey?: boolean;
    ctrlKey?: boolean;
  };
}
