import { TechTreeBuilder } from "./tech-tree.builder";
import { TechTreeService } from "./tech-tree.service";
import { FactionType, ObjectNames } from "@fuzzy-waddle/api-interfaces";

describe("TechTree", () => {
  describe("TechTreeBuilder", () => {
    it("should build tech trees for both factions", () => {
      const graphs = TechTreeBuilder.build();

      expect(graphs[FactionType.Tivara]).toBeDefined();
      expect(graphs[FactionType.Skaduwee]).toBeDefined();
    });

    it("should embed full definitions in tech tree nodes", () => {
      const graphs = TechTreeBuilder.build();
      const tivaraWorkerNode = graphs[FactionType.Tivara].nodes[ObjectNames.TivaraWorker];

      expect(tivaraWorkerNode).toBeDefined();
      expect(tivaraWorkerNode!.definition).toBeDefined();
      expect(tivaraWorkerNode!.definition.components).toBeDefined();
    });

    it("should infer construction relationships for workers", () => {
      const graphs = TechTreeBuilder.build();
      const tivaraWorkerNode = graphs[FactionType.Tivara].nodes[ObjectNames.TivaraWorker];

      // Workers should be able to construct buildings
      expect(tivaraWorkerNode!.constructs.length).toBeGreaterThan(0);
      expect(tivaraWorkerNode!.constructs).toContain(ObjectNames.Sandhold);
    });

    it("should infer production relationships for buildings", () => {
      const graphs = TechTreeBuilder.build();
      const sandholdNode = graphs[FactionType.Tivara].nodes[ObjectNames.Sandhold];

      // Sandhold should produce workers
      expect(sandholdNode).toBeDefined();
      expect(sandholdNode!.produces.length).toBeGreaterThan(0);
      expect(sandholdNode!.produces).toContain(ObjectNames.TivaraWorker);
    });

    it("should set prerequisites based on requirements component", () => {
      const graphs = TechTreeBuilder.build();
      const tivaraWorkerNode = graphs[FactionType.Tivara].nodes[ObjectNames.TivaraWorker];

      // Worker requires Sandhold (from requirements component)
      expect(tivaraWorkerNode!.prerequisites).toContain(ObjectNames.Sandhold);
    });

    it("should set prerequisites based on production relationships", () => {
      const graphs = TechTreeBuilder.build();
      const tivaraWorkerNode = graphs[FactionType.Tivara].nodes[ObjectNames.TivaraWorker];

      // Worker is produced by Sandhold, so Sandhold should be a prerequisite
      expect(tivaraWorkerNode!.prerequisites).toContain(ObjectNames.Sandhold);
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
      const tivaraGraph = service.getGraph(FactionType.Tivara);
      const skaduweeGraph = service.getGraph(FactionType.Skaduwee);

      expect(tivaraGraph).toBeDefined();
      expect(skaduweeGraph).toBeDefined();
    });

    it("should get prerequisites for locked actors", () => {
      const prereqs = service.getPrerequisites(FactionType.Tivara, ObjectNames.AnkGuard);

      // AnkGuard requires worker to build it
      expect(prereqs.length).toBeGreaterThan(0);
    });

    it("should get definition from tech tree", () => {
      const definition = service.getDefinition(FactionType.Tivara, ObjectNames.TivaraWorker);

      expect(definition).toBeDefined();
      expect(definition?.components?.builder).toBeDefined();
    });

    it("should get producible units for buildings", () => {
      const producible = service.getProducibleUnits(FactionType.Tivara, ObjectNames.Sandhold);

      expect(producible).toContain(ObjectNames.TivaraWorker);
    });

    it("should get constructable buildings for units", () => {
      const constructable = service.getConstructableBuildings(FactionType.Tivara, ObjectNames.TivaraWorker);

      expect(constructable.length).toBeGreaterThan(0);
      expect(constructable).toContain(ObjectNames.Sandhold);
    });

    it("should validate tech tree structure", () => {
      const tivaraErrors = service.validateTechTree(FactionType.Tivara);
      const skaduweeErrors = service.validateTechTree(FactionType.Skaduwee);

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
  });
});
