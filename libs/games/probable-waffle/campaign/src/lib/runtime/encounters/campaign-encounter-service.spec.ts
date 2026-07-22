import { ObjectNames, type CampaignMissionEncounterRuntimeState } from "@fuzzy-waddle/probable-waffle-protocol";
import { asCampaignContentId } from "../../contracts/campaign-content-id";
import type { ResolvedMissionEncounterDefinition } from "../campaign-difficulty-resolver";
import { DefaultCampaignEncounterService, type CampaignEncounterWorldAdapter } from "./campaign-encounter-service";

describe("DefaultCampaignEncounterService", () => {
  it("uses simulation ticks for waves and restores actor membership and ownership", () => {
    const states: Record<string, CampaignMissionEncounterRuntimeState> = {};
    const alive = new Set<string>();
    let spawnNumber = 0;
    const world: CampaignEncounterWorldAdapter = {
      spawnWave: (_encounterId, _waveId, groups) => {
        const actors = groups.flatMap((group) =>
          group.actors.map((actor) => {
            const actorRuntimeId = `spawn-${++spawnNumber}`;
            alive.add(actorRuntimeId);
            return { actorRuntimeId, ownerPlayerNumber: actor.ownerPlayerNumber };
          })
        );
        return { status: "spawned", actors };
      },
      isActorAlive: (actorRuntimeId) => alive.has(actorRuntimeId)
    };
    const service = new DefaultCampaignEncounterService([encounter()], states);
    const advance = (tick: number) =>
      service.advance({ tick, evaluate: () => true, executeActions: () => true, world });

    expect(advance(0)).toEqual([expect.objectContaining({ kind: "started" })]);
    expect(advance(2)).toEqual([expect.objectContaining({ kind: "wave-warning", waveId: "first-wave" })]);
    expect(spawnNumber).toBe(0);
    expect(advance(3)).toEqual([expect.objectContaining({ kind: "wave-spawned", waveId: "first-wave" })]);
    expect(service.getState("ambush")).toMatchObject({
      waveIndex: 1,
      nextEligibleTick: 6,
      livingSpawnedActorIds: ["spawn-1"],
      spawnedActorOwners: { "spawn-1": 2 }
    });

    const restoredStates = structuredClone(states);
    const restored = new DefaultCampaignEncounterService([encounter()], restoredStates);
    restored.observeEvent({
      tick: 4,
      sequence: 1,
      kind: "actor.owner-changed",
      sourceId: "spawn-1",
      payload: { actorRuntimeId: "spawn-1", owner: 1 }
    });
    expect(restored.getState("ambush")?.spawnedActorOwners).toEqual({ "spawn-1": 1 });

    alive.delete("spawn-1");
    expect(restored.advance({ tick: 6, evaluate: () => true, executeActions: () => true, world })).toEqual([
      expect.objectContaining({ kind: "wave-spawned", waveId: "second-wave" })
    ]);
    expect(restored.getState("ambush")).toMatchObject({ waveIndex: 2, livingSpawnedActorIds: ["spawn-2"] });
    alive.delete("spawn-2");
    expect(restored.advance({ tick: 7, evaluate: () => true, executeActions: () => true, world })).toEqual([
      expect.objectContaining({ kind: "completed" })
    ]);
  });

  it("persists deterministic branch selection and applies an authored delay policy", () => {
    const states: Record<string, CampaignMissionEncounterRuntimeState> = {};
    let blocked = true;
    const world: CampaignEncounterWorldAdapter = {
      spawnWave: (_encounterId, _waveId, groups) =>
        blocked
          ? { status: "blocked", reason: "occupied" }
          : {
              status: "spawned",
              actors: groups.flatMap((group) =>
                group.actors.map((_actor, index) => ({ actorRuntimeId: `branch-${index}` }))
              )
            },
      isActorAlive: () => true
    };
    const definition = encounter();
    const firstWave = definition.waves[0];
    if (!firstWave) throw new Error("Encounter fixture requires a first wave");
    const branched = {
      ...definition,
      initialDelayTicks: 0,
      waves: [
        {
          ...firstWave,
          delayTicks: 0,
          blockedSpawnPolicy: "delay" as const,
          blockedRetryTicks: 2,
          branches: [
            { id: asCampaignContentId<"encounter-branch">("left"), spawns: firstWave.spawns },
            { id: asCampaignContentId<"encounter-branch">("right"), spawns: firstWave.spawns }
          ]
        }
      ]
    } satisfies ResolvedMissionEncounterDefinition;
    const service = new DefaultCampaignEncounterService([branched], states);
    const context = (tick: number) => ({ tick, evaluate: () => true, executeActions: () => true, world });

    service.advance(context(0));
    const branchId = service.getState("ambush")?.deterministicBranchIds["first-wave"];
    expect(branchId).toMatch(/left|right/);
    expect(service.getState("ambush")?.nextEligibleTick).toBe(2);
    blocked = false;
    expect(service.advance(context(1))).toEqual([]);
    expect(service.advance(context(2))).toEqual([expect.objectContaining({ kind: "wave-spawned" })]);
    expect(service.getState("ambush")?.deterministicBranchIds["first-wave"]).toBe(branchId);
  });

  it("releases converted wave actors when authored", () => {
    const states: Record<string, CampaignMissionEncounterRuntimeState> = {
      ambush: {
        status: "active",
        waveIndex: 1,
        livingSpawnedActorIds: ["rescued"],
        spawnedActorOwners: { rescued: 2 },
        spawnCursor: 1,
        deterministicBranchIds: {},
        warnedWaveIds: [],
        blockedAttempts: 0
      }
    };
    const service = new DefaultCampaignEncounterService([{ ...encounter(), convertedActorPolicy: "release" }], states);

    service.observeEvent({
      tick: 5,
      sequence: 1,
      kind: "actor.owner-changed",
      payload: { actorRuntimeId: "rescued", owner: 1 }
    });

    expect(service.getState("ambush")).toMatchObject({
      livingSpawnedActorIds: [],
      spawnedActorOwners: {}
    });
  });

  it("can release encounter ownership without destroying story actors", () => {
    const states: Record<string, CampaignMissionEncounterRuntimeState> = {
      ambush: {
        status: "active",
        waveIndex: 1,
        livingSpawnedActorIds: ["story-survivor"],
        spawnedActorOwners: { "story-survivor": 2 },
        spawnCursor: 1,
        deterministicBranchIds: {},
        warnedWaveIds: [],
        blockedAttempts: 0
      }
    };
    const service = new DefaultCampaignEncounterService([encounter()], states);

    service.stop("ambush", { status: "completed", spawnedActors: "release" });

    expect(service.getState("ambush")).toMatchObject({
      status: "completed",
      livingSpawnedActorIds: [],
      spawnedActorOwners: {}
    });
  });

  it("fails closed on spawn errors even when an occupancy policy would skip", () => {
    const states: Record<string, CampaignMissionEncounterRuntimeState> = {};
    const definition = encounter();
    const firstWave = definition.waves[0];
    if (!firstWave) throw new Error("Encounter fixture requires a first wave");
    const service = new DefaultCampaignEncounterService(
      [
        {
          ...definition,
          initialDelayTicks: 0,
          waves: [{ ...firstWave, delayTicks: 0, blockedSpawnPolicy: "skip" }]
        }
      ],
      states
    );

    const effects = service.advance({
      tick: 0,
      evaluate: () => true,
      executeActions: () => true,
      world: { spawnWave: () => ({ status: "failed", reason: "invalid prefab" }), isActorAlive: () => true }
    });

    expect(effects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "started" }),
        expect.objectContaining({ kind: "failed", detail: "invalid prefab" })
      ])
    );
    expect(service.getState("ambush")).toMatchObject({ status: "failed", failureReason: "invalid prefab" });
  });
});

function encounter(): ResolvedMissionEncounterDefinition {
  const spawn = (wave: string, delayTicks: number) => ({
    id: asCampaignContentId<"encounter-wave">(wave),
    delayTicks,
    warningTicks: wave === "first-wave" ? 1 : undefined,
    spawns: [
      {
        spawnSetId: asCampaignContentId<"scenario-spawn-set">(`${wave}-spawns`),
        actors: [{ actorName: ObjectNames.TivaraWorker, ownerPlayerNumber: 2 }]
      }
    ]
  });
  return {
    id: asCampaignContentId<"encounter">("ambush"),
    start: { kind: "always" },
    initialDelayTicks: 1,
    waves: [spawn("first-wave", 2), spawn("second-wave", 3)]
  };
}
