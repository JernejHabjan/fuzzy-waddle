import { SelectionTabHandler } from "./selection-tab-handler";
import { ProbableWaffleScene } from "../../core/probable-waffle.scene";

// Mock the dependencies
jest.mock("../../data/scene-data");

describe("SelectionTabHandler", () => {
  let mockScene: any;
  let handler: SelectionTabHandler;
  let mockActors: any[];

  beforeEach(() => {
    // Create mock scene
    mockScene = {
      input: {
        keyboard: {
          on: jest.fn(),
          off: jest.fn()
        }
      },
      events: {
        once: jest.fn()
      }
    };

    // Create mock actors with different names
    mockActors = [
      { name: "Warrior" },
      { name: "Warrior" },
      { name: "Warrior" },
      { name: "Archer" },
      { name: "Archer" },
      { name: "Worker" },
      { name: "Barracks" }
    ];

    handler = new SelectionTabHandler(mockScene as ProbableWaffleScene);
  });

  afterEach(() => {
    handler.destroy();
  });

  it("should create handler and set up keyboard listener", () => {
    expect(mockScene.input.keyboard.on).toHaveBeenCalledWith("keydown", expect.any(Function), handler);
  });

  it("should initialize with empty groups and tab index 0", () => {
    expect(handler.currentTabIndex).toBe(0);
    expect(handler.groupedActors).toEqual([]);
    expect(handler.currentTabActors).toEqual([]);
  });

  it("should group actors by name correctly", () => {
    // Mock getSelectedActors to return our mock actors
    const { getSelectedActors } = require("../../data/scene-data");
    (getSelectedActors as jest.Mock).mockReturnValue(mockActors);

    handler.updateGroupedActors();

    const groups = handler.groupedActors;
    expect(groups.length).toBe(4); // Warrior, Archer, Worker, Barracks

    // Check Warrior group (first in selection)
    expect(groups[0]?.length).toBe(3);
    expect(groups[0]?.[0]?.name).toBe("Warrior");

    // Check Archer group
    expect(groups[1]?.length).toBe(2);
    expect(groups[1]?.[0]?.name).toBe("Archer");

    // Check Worker group
    expect(groups[2]?.length).toBe(1);
    expect(groups[2]?.[0]?.name).toBe("Worker");

    // Check Barracks group
    expect(groups[3]?.length).toBe(1);
    expect(groups[3]?.[0]?.name).toBe("Barracks");
  });

  it("should reset tab index to 0 when selection changes", () => {
    const { getSelectedActors } = require("../../data/scene-data");
    (getSelectedActors as jest.Mock).mockReturnValue(mockActors);

    handler.updateGroupedActors();
    handler.nextTab(); // Move to tab 1
    expect(handler.currentTabIndex).toBe(1);

    // Update with new selection
    handler.updateGroupedActors();
    expect(handler.currentTabIndex).toBe(0); // Should reset to 0
  });

  it("should cycle through tabs correctly", () => {
    const { getSelectedActors } = require("../../data/scene-data");
    (getSelectedActors as jest.Mock).mockReturnValue(mockActors);

    handler.updateGroupedActors();

    expect(handler.currentTabIndex).toBe(0);
    handler.nextTab();
    expect(handler.currentTabIndex).toBe(1);
    handler.nextTab();
    expect(handler.currentTabIndex).toBe(2);
    handler.nextTab();
    expect(handler.currentTabIndex).toBe(3);
    handler.nextTab();
    expect(handler.currentTabIndex).toBe(0); // Should wrap around
  });

  it("should not cycle tabs when only one group exists", () => {
    const { getSelectedActors } = require("../../data/scene-data");
    // Only warriors
    (getSelectedActors as jest.Mock).mockReturnValue([mockActors[0], mockActors[1], mockActors[2]]);

    handler.updateGroupedActors();

    expect(handler.groupedActors.length).toBe(1);
    expect(handler.currentTabIndex).toBe(0);

    handler.nextTab();
    expect(handler.currentTabIndex).toBe(0); // Should not change
  });

  it("should return current tab actors correctly", () => {
    const { getSelectedActors } = require("../../data/scene-data");
    (getSelectedActors as jest.Mock).mockReturnValue(mockActors);

    handler.updateGroupedActors();

    // Tab 0 - Warriors
    let currentActors = handler.currentTabActors;
    expect(currentActors.length).toBe(3);
    expect(currentActors[0]?.name).toBe("Warrior");

    handler.nextTab();

    // Tab 1 - Archers
    currentActors = handler.currentTabActors;
    expect(currentActors.length).toBe(2);
    expect(currentActors[0]?.name).toBe("Archer");
  });

  it("should clear groups when selection is empty", () => {
    const { getSelectedActors } = require("../../data/scene-data");
    (getSelectedActors as jest.Mock).mockReturnValue(mockActors);

    handler.updateGroupedActors();
    expect(handler.groupedActors.length).toBeGreaterThan(0);

    // Clear selection
    (getSelectedActors as jest.Mock).mockReturnValue([]);
    handler.updateGroupedActors();

    expect(handler.groupedActors).toEqual([]);
    expect(handler.currentTabIndex).toBe(0);
    expect(handler.currentTabActors).toEqual([]);
  });

  it("should clean up on destroy", () => {
    handler.destroy();
    expect(mockScene.input.keyboard.off).toHaveBeenCalledWith("keydown", expect.any(Function), handler);
  });

  it("should maintain order of first occurrence when grouping", () => {
    const { getSelectedActors } = require("../../data/scene-data");
    const mixedActors = [
      { name: "Worker" },
      { name: "Warrior" },
      { name: "Worker" },
      { name: "Warrior" },
    ];
    (getSelectedActors as jest.Mock).mockReturnValue(mixedActors);

    handler.updateGroupedActors();

    const groups = handler.groupedActors;
    expect(groups.length).toBe(2);
    
    // Worker appears first in selection, so should be first group
    expect(groups[0]?.[0]?.name).toBe("Worker");
    expect(groups[0]?.length).toBe(2);
    
    // Warrior appears second
    expect(groups[1]?.[0]?.name).toBe("Warrior");
    expect(groups[1]?.length).toBe(2);
  });
});
