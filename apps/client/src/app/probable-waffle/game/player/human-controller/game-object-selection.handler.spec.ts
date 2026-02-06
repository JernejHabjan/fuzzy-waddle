import { GameObjectSelectionHandler } from "./game-object-selection.handler";
import { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { OwnerComponent } from "../../entity/components/owner-component";

// Mock the dependencies
jest.mock("../../data/scene-data");
jest.mock("../../data/actor-component");
jest.mock("../../data/game-object-helper");

// Mock Phaser.Geom.Rectangle directly since the phaser mock might not be loaded yet
global.Phaser = {
  Geom: {
    Rectangle: class Rectangle {
      x: number;
      y: number;
      width: number;
      height: number;
      
      constructor(x: number, y: number, width: number, height: number) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
      }
      
      static Intersection(rectA: any, rectB: any) {
        const x = Math.max(rectA.x, rectB.x);
        const y = Math.max(rectA.y, rectB.y);
        const width = Math.min(rectA.x + rectA.width, rectB.x + rectB.width) - x;
        const height = Math.min(rectA.y + rectA.height, rectB.y + rectB.height) - y;
        
        return {
          x,
          y,
          width: Math.max(0, width),
          height: Math.max(0, height)
        };
      }
      
      static Overlaps(rectA: any, rectB: any) {
        return (
          rectA.x < rectB.x + rectB.width &&
          rectA.x + rectA.width > rectB.x &&
          rectA.y < rectB.y + rectB.height &&
          rectA.y + rectA.height > rectB.y
        );
      }
    }
  }
} as any;

describe("GameObjectSelectionHandler - Multi-select filtering", () => {
  let mockScene: any;
  let handler: GameObjectSelectionHandler;

  beforeEach(() => {
    // Create mock scene
    mockScene = {
      input: {
        keyboard: {
          on: jest.fn(),
          off: jest.fn()
        }
      },
      cameras: {
        main: {
          getWorldPoint: jest.fn((x, y) => ({ x, y }))
        }
      },
      communicator: {
        allScenes: {
          pipe: jest.fn(() => ({
            subscribe: jest.fn(() => ({ unsubscribe: jest.fn() }))
          })),
          subscribe: jest.fn(() => ({ unsubscribe: jest.fn() }))
        }
      },
      onShutdown: {
        subscribe: jest.fn(() => ({ unsubscribe: jest.fn() }))
      }
    };
  });

  describe("getSelectableComponentsUnderSelectedArea", () => {
    it("should filter out enemy units when friendly units are present in selection", () => {
      const { getActorComponent } = require("../../data/actor-component");
      const { getSelectableSceneChildren, getCurrentPlayerNumber } = require("../../data/scene-data");
      const { getGameObjectBounds } = require("../../data/game-object-helper");

      const currentPlayerNr = 1;
      
      // Mock friendly units
      const friendlyUnit1 = { name: "Warrior", scene: mockScene };
      const friendlyUnit2 = { name: "Archer", scene: mockScene };
      
      // Mock enemy units
      const enemyUnit1 = { name: "EnemyWarrior", scene: mockScene };
      const enemyUnit2 = { name: "EnemyArcher", scene: mockScene };

      // Mock getCurrentPlayerNumber to return player 1
      (getCurrentPlayerNumber as jest.Mock).mockReturnValue(currentPlayerNr);

      // Mock getSelectableSceneChildren to return both friendly and enemy units
      (getSelectableSceneChildren as jest.Mock).mockReturnValue([
        friendlyUnit1,
        friendlyUnit2,
        enemyUnit1,
        enemyUnit2
      ]);

      // Mock getGameObjectBounds to return bounds for all units
      (getGameObjectBounds as jest.Mock).mockReturnValue({
        x: 0,
        y: 0,
        width: 50,
        height: 50
      });

      // Mock getActorComponent to return OwnerComponent with different owners
      (getActorComponent as jest.Mock).mockImplementation((actor: any, componentType: any) => {
        if (componentType === OwnerComponent) {
          if (actor === friendlyUnit1 || actor === friendlyUnit2) {
            return { getOwner: () => currentPlayerNr };
          } else {
            return { getOwner: () => 2 }; // Enemy player
          }
        }
        return undefined;
      });

      handler = new GameObjectSelectionHandler(mockScene as ProbableWaffleScene);

      // Access the private method using type assertion
      const result = (handler as any).getSelectableComponentsUnderSelectedArea({
        x: 0,
        y: 0,
        width: 100,
        height: 100
      });

      // Should only return friendly units
      expect(result).toHaveLength(2);
      expect(result).toContain(friendlyUnit1);
      expect(result).toContain(friendlyUnit2);
      expect(result).not.toContain(enemyUnit1);
      expect(result).not.toContain(enemyUnit2);
    });

    it("should return all units when no friendly units are in selection", () => {
      const { getActorComponent } = require("../../data/actor-component");
      const { getSelectableSceneChildren, getCurrentPlayerNumber } = require("../../data/scene-data");
      const { getGameObjectBounds } = require("../../data/game-object-helper");

      const currentPlayerNr = 1;
      
      // Mock only enemy units
      const enemyUnit1 = { name: "EnemyWarrior", scene: mockScene };
      const enemyUnit2 = { name: "EnemyArcher", scene: mockScene };

      // Mock getCurrentPlayerNumber to return player 1
      (getCurrentPlayerNumber as jest.Mock).mockReturnValue(currentPlayerNr);

      // Mock getSelectableSceneChildren to return only enemy units
      (getSelectableSceneChildren as jest.Mock).mockReturnValue([
        enemyUnit1,
        enemyUnit2
      ]);

      // Mock getGameObjectBounds to return bounds for all units
      (getGameObjectBounds as jest.Mock).mockReturnValue({
        x: 0,
        y: 0,
        width: 50,
        height: 50
      });

      // Mock getActorComponent to return OwnerComponent with enemy owner
      (getActorComponent as jest.Mock).mockImplementation((actor: any, componentType: any) => {
        if (componentType === OwnerComponent) {
          return { getOwner: () => 2 }; // Enemy player
        }
        return undefined;
      });

      handler = new GameObjectSelectionHandler(mockScene as ProbableWaffleScene);

      // Access the private method using type assertion
      const result = (handler as any).getSelectableComponentsUnderSelectedArea({
        x: 0,
        y: 0,
        width: 100,
        height: 100
      });

      // Should return all enemy units when no friendly units are present
      expect(result).toHaveLength(2);
      expect(result).toContain(enemyUnit1);
      expect(result).toContain(enemyUnit2);
    });

    it("should return empty array when no units overlap selection area", () => {
      const { getSelectableSceneChildren, getCurrentPlayerNumber } = require("../../data/scene-data");
      const { getGameObjectBounds } = require("../../data/game-object-helper");

      // Mock getCurrentPlayerNumber
      (getCurrentPlayerNumber as jest.Mock).mockReturnValue(1);

      // Mock getSelectableSceneChildren to return some units
      (getSelectableSceneChildren as jest.Mock).mockReturnValue([
        { name: "Warrior", scene: mockScene }
      ]);

      // Mock getGameObjectBounds to return bounds that don't overlap
      (getGameObjectBounds as jest.Mock).mockReturnValue({
        x: 1000,
        y: 1000,
        width: 50,
        height: 50
      });

      handler = new GameObjectSelectionHandler(mockScene as ProbableWaffleScene);

      // Access the private method using type assertion
      const result = (handler as any).getSelectableComponentsUnderSelectedArea({
        x: 0,
        y: 0,
        width: 100,
        height: 100
      });

      // Should return empty array when no units overlap
      expect(result).toHaveLength(0);
    });
  });
});
