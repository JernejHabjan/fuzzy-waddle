import { ProbableWaffleCommunicatorEvent } from "./communicators";

export interface ProbableWaffleCommunicatorSelectionEvent extends ProbableWaffleCommunicatorEvent {
  type: "deselect" | "singleSelect" | "multiSelect" | "multiSelectPreview" | "terrainSelect";
  data?: {
    selected?: string[];
    selectedArea?: { x: number; y: number; width: number; height: number };
    terrainSelected?: { x: number; y: number; z: number };
  };
}
