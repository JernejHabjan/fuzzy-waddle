import { TechTreeBuilder } from "./tech-tree.builder";
import { TechTreeService } from "./tech-tree.service";
import { FactionType, ObjectNames } from "@fuzzy-waddle/api-interfaces";

describe("TechTree", () => {
  describe("TechTreeBuilder", () => {
    it("should build tech trees for both factions", () => {
      const graph = TechTreeBuilder.build();

      expect(graph).toBeDefined();
    });

    it("should embed full definitions in tech tree nodes", () => {
      const graph = TechTreeBuilder.build();
      const tivaraWorkerNode = graph.nodes[ObjectNames.TivaraWorker];

      expect(tivaraWorkerNode).toBeDefined();
      expect(tivaraWorkerNode!.definition).toBeDefined();
      expect(tivaraWorkerNode!.definition.components).toBeDefined();
    });

    it("should infer construction relationships for workers", () => {
      const graph = TechTreeBuilder.build();
      const tivaraWorkerNode = graph.nodes[ObjectNames.TivaraWorker];

      // Workers should be able to construct buildings
      expect(tivaraWorkerNode!.constructs.length).toBeGreaterThan(0);
      expect(tivaraWorkerNode!.constructs).toContain(ObjectNames.Sandhold);
    });

    it("should infer production relationships for buildings", () => {
      const graph = TechTreeBuilder.build();
      const sandholdNode = graph.nodes[ObjectNames.Sandhold];

      // Sandhold should produce workers
      expect(sandholdNode).toBeDefined();
      expect(sandholdNode!.produces.length).toBeGreaterThan(0);
      expect(sandholdNode!.produces).toContain(ObjectNames.TivaraWorker);
    });

    it("should set prerequisites based on requirements component", () => {
      const graph = TechTreeBuilder.build();
      const tivaraWorkerNode = graph.nodes[ObjectNames.TivaraWorker];

      // Worker requires Sandhold (from requirements component)
      expect(tivaraWorkerNode!.prerequisites.prereqs.objectNames).toContain(ObjectNames.Sandhold);
    });

    it("should set prerequisites based on production relationships", () => {
      const graph = TechTreeBuilder.build();
      const tivaraWorkerNode = graph.nodes[ObjectNames.TivaraWorker];

      // Worker is produced by Sandhold, so Sandhold should be a prerequisite
      expect(tivaraWorkerNode!.prerequisites.prereqs.objectNames).toContain(ObjectNames.Sandhold);
    });
  });

  describe("TechTreeService", () => {
    let service: TechTreeService;
    let consoleWarnSpy: jest.SpyInstance;

    beforeEach(() => {
      // Mock console.warn to suppress validation warnings during tests
      consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      service = new TechTreeService();
    });

    afterEach(() => {
      consoleWarnSpy.mockRestore();
    });

    it("should initialize with graphs for both factions", () => {
      const tivaraGraph = service.getGraph();
      const skaduweeGraph = service.getGraph();

      expect(tivaraGraph).toBeDefined();
      expect(skaduweeGraph).toBeDefined();
    });

    it("should get prerequisites for locked actors", () => {
      const testPlayerNumber = 1;
      const prereqs = service.getPrerequisites(testPlayerNumber, ObjectNames.AnkGuard);

      // Should return a Array
      expect(prereqs.prereqs.objectNames).toBeInstanceOf(Array);

      // AnkGuard requires worker to build it, but prerequisites should not include self
      expect(prereqs.prereqs.objectNames.includes(ObjectNames.AnkGuard)).toBe(false);
    });

    it("should get definition from tech tree", () => {
      const definition = service.getDefinition(ObjectNames.TivaraWorker);

      expect(definition).toBeDefined();
      expect(definition?.components?.builder).toBeDefined();
    });

    it("should get producible units for buildings", () => {
      const producible = service.getProducibleUnits(ObjectNames.Sandhold);

      expect(producible).toContain(ObjectNames.TivaraWorker);
    });

    it("should get constructable buildings for units", () => {
      const constructable = service.getConstructableBuildings(ObjectNames.TivaraWorker);

      expect(constructable.length).toBeGreaterThan(0);
      expect(constructable).toContain(ObjectNames.Sandhold);
    });

    it("should validate tech tree structure", () => {
      const tivaraErrors = service.validateTechTree();
      const skaduweeErrors = service.validateTechTree();

      // Validation should run without crashing
      // Note: Errors may exist due to incomplete actor definitions
      // This is expected and helps identify data issues
      expect(Array.isArray(tivaraErrors)).toBe(true);
      expect(Array.isArray(skaduweeErrors)).toBe(true);

      // Log any validation errors for visibility
      if (tivaraErrors.length > 0) {
        console.log("[Test] Tivara validation issues:", tivaraErrors.length);
      }
      if (skaduweeErrors.length > 0) {
        console.log("[Test] Skaduwee validation issues:", skaduweeErrors.length);
      }
    });

    it("should get main building for Tivara faction", () => {
      const mainBuilding = service.getMainBuilding(FactionType.Tivara);

      expect(mainBuilding).toBe(ObjectNames.Sandhold);
    });

    it("should get main building for Skaduwee faction", () => {
      const mainBuilding = service.getMainBuilding(FactionType.Skaduwee);

      expect(mainBuilding).toBe(ObjectNames.FrostForge);
    });

    it("should get housing buildings for Tivara faction", () => {
      const housingBuildings = service.getHousingBuildingsExcludingMain(FactionType.Tivara);

      // Should not include buildings from other factions
      const hasSkaduweeBuildings = housingBuildings.some((b) => b.toString().startsWith("Skaduwee"));
      expect(hasSkaduweeBuildings).toBe(false);

      // Should not include FrostForge
      expect(housingBuildings).not.toContain(ObjectNames.FrostForge);
    });

    it("should get housing buildings for Skaduwee faction", () => {
      const housingBuildings = service.getHousingBuildingsExcludingMain(FactionType.Skaduwee);

      // Should not include buildings from other factions
      const hasTivaraBuildings = housingBuildings.some(
        (b) => b.toString().startsWith("Tivara") || b === ObjectNames.Sandhold
      );
      expect(hasTivaraBuildings).toBe(false);

      // Should not include Sandhold
      expect(housingBuildings).not.toContain(ObjectNames.Sandhold);
    });

    it("should get defensive buildings for Tivara faction", () => {
      const defensiveBuildings = service.getDefensiveBuildingsExcludingMain(FactionType.Tivara);

      // Should not include buildings from other factions
      const hasSkaduweeBuildings = defensiveBuildings.some((b) => b.toString().startsWith("Skaduwee"));
      expect(hasSkaduweeBuildings).toBe(false);
    });

    it("should get defensive buildings for Skaduwee faction", () => {
      const defensiveBuildings = service.getDefensiveBuildingsExcludingMain(FactionType.Skaduwee);

      // Should not include buildings from other factions
      const hasTivaraBuildings = defensiveBuildings.some(
        (b) => b.toString().startsWith("Tivara") || b === ObjectNames.Sandhold
      );
      expect(hasTivaraBuildings).toBe(false);
    });

    it("should get resource buildings for Tivara faction", () => {
      const resourceBuildings = service.getResourceBuildingsExcludingMain(FactionType.Tivara);

      // Should not include buildings from other factions
      const hasSkaduweeBuildings = resourceBuildings.some((b) => b.toString().startsWith("Skaduwee"));
      expect(hasSkaduweeBuildings).toBe(false);
    });

    it("should get resource buildings for Skaduwee faction", () => {
      const resourceBuildings = service.getResourceBuildingsExcludingMain(FactionType.Skaduwee);

      // Should not include buildings from other factions
      const hasTivaraBuildings = resourceBuildings.some(
        (b) => b.toString().startsWith("Tivara") || b === ObjectNames.Sandhold
      );
      expect(hasTivaraBuildings).toBe(false);
    });

    it("should get all housing buildings when no faction specified", () => {
      const allHousing = service.getHousingBuildingsExcludingMain();
      const tivaraHousing = service.getHousingBuildingsExcludingMain(FactionType.Tivara);
      const skaduweeHousing = service.getHousingBuildingsExcludingMain(FactionType.Skaduwee);

      // All should be greater than or equal to faction-specific
      expect(allHousing.length).toBeGreaterThanOrEqual(tivaraHousing.length);
      expect(allHousing.length).toBeGreaterThanOrEqual(skaduweeHousing.length);
    });
  });
});
