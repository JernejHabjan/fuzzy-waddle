import {
  digestAiWorldProjection,
  digestAuthoritativeStateProjection,
  findFirstAuthoritativeStateDifference,
  type AuthoritativeStateProjection
} from "./authoritative-state-projection";

const projection: AuthoritativeStateProjection = {
  schemaVersion: 1,
  actors: [
    { actorId: "b", digest: "b:state", aiState: { spell: { remainingCooldown: 50 } } },
    { actorId: "a", digest: "a:state" }
  ],
  players: ["2:state", "1:state"],
  research: ["2:z", "1:a"],
  campaignMission: "mission",
  campaignMissionFamilies: { z: "2", a: "1" },
  random: "rng",
  systems: { commandAuthority: "authority", aiControllers: "ai" }
};

describe("Stage 5 authoritative world projection", () => {
  it("keeps multiplayer and AI digests stable across set insertion order", () => {
    const reversed = {
      ...projection,
      actors: [...projection.actors].reverse(),
      players: [...projection.players].reverse(),
      research: [...projection.research].reverse()
    };
    expect(digestAuthoritativeStateProjection(reversed)).toBe(digestAuthoritativeStateProjection(projection));
    expect(digestAiWorldProjection(reversed)).toBe(digestAiWorldProjection(projection));
    expect(digestAuthoritativeStateProjection(projection)).toBe(
      legacyDjb2("a:state|b:state#1:state|2:state#1:a|2:z#mission#rng")
    );
  });

  it("reports an injected actor divergence at its first normalized path", () => {
    const changed = {
      ...projection,
      actors: projection.actors.map((actor) => (actor.actorId === "b" ? { ...actor, digest: "b:changed" } : actor))
    };
    expect(findFirstAuthoritativeStateDifference(projection, changed)?.path).toBe("$.actors[1].digest");
  });

  it("reports an injected AI continuation at its normalized nested field", () => {
    const changed = {
      ...projection,
      actors: projection.actors.map((actor) =>
        actor.actorId === "b" ? { ...actor, aiState: { spell: { remainingCooldown: 100 } } } : actor
      )
    };
    expect(findFirstAuthoritativeStateDifference(projection, changed)?.path).toBe(
      "$.actors[1].aiState.spell.remainingCooldown"
    );
  });
});

function legacyDjb2(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 33) ^ value.charCodeAt(index);
  return (hash >>> 0).toString(16).padStart(8, "0");
}
