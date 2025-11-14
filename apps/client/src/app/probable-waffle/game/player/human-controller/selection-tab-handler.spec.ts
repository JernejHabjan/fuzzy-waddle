import { SelectionTabHandler } from "./selection-tab-handler";
import { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { getActorComponent } from "../../data/actor-component";
import { AttackComponent } from "../../entity/components/combat/components/attack-component";
import { ProductionComponent } from "../../entity/components/production/production-component";
import { GathererComponent } from "../../entity/components/resource/gatherer-component";

// Mock the dependencies
jest.mock("../../data/scene-data");
jest.mock("../../data/actor-component");

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

    // Create mock actors with different components
    mockActors = [
      { name: "AttackUnit1" },
      { name: "AttackUnit2" },
      { name: "ProductionBuilding1" },
      { name: "GathererUnit1" },
      { name: "GathererUnit2" },
      { name: "OtherUnit1" }
    ];

    // Mock getActorComponent to return different components based on actor name
    (getActorComponent as jest.Mock).mockImplementation((actor: any, componentType: any) => {
      if (componentType === AttackComponent) {
        return actor.name.startsWith("AttackUnit") ? {} : undefined;
      }
      if (componentType === ProductionComponent) {
        return actor.name.startsWith("ProductionBuilding") ? {} : undefined;
      }
      if (componentType === GathererComponent) {
        return actor.name.startsWith("GathererUnit") ? {} : undefined;
      }
      return undefined;
    });

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

  it("should group actors by type correctly", () => {
    // Mock getSelectedActors to return our mock actors
    const { getSelectedActors } = require("../../data/scene-data");
    (getSelectedActors as jest.Mock).mockReturnValue(mockActors);

    handler.updateGroupedActors();

    const groups = handler.groupedActors;
    expect(groups.length).toBe(4); // attack, production, gatherer, other

    // Check attack group (highest priority)
    expect(groups[0]?.length).toBe(2);
    expect(groups[0]?.[0]?.name).toBe("AttackUnit1");

    // Check production group
    expect(groups[1]?.length).toBe(1);
    expect(groups[1]?.[0]?.name).toBe("ProductionBuilding1");

    // Check gatherer group
    expect(groups[2]?.length).toBe(2);
    expect(groups[2]?.[0]?.name).toBe("GathererUnit1");

    // Check other group
    expect(groups[3]?.length).toBe(1);
    expect(groups[3]?.[0]?.name).toBe("OtherUnit1");
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
    // Only attack units
    (getSelectedActors as jest.Mock).mockReturnValue([mockActors[0], mockActors[1]]);

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

    // Tab 0 - Attack units
    let currentActors = handler.currentTabActors;
    expect(currentActors.length).toBe(2);
    expect(currentActors[0]?.name).toBe("AttackUnit1");

    handler.nextTab();

    // Tab 1 - Production buildings
    currentActors = handler.currentTabActors;
    expect(currentActors.length).toBe(1);
    expect(currentActors[0]?.name).toBe("ProductionBuilding1");
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
});
