import {
  digestAiWorldProjectionV1,
  digestAuthoritativeStateProjectionV1,
  findFirstAuthoritativeStateDifferenceV1,
  type AuthoritativeStateProjectionV1
} from "./authoritative-state-projection";

const projection: AuthoritativeStateProjectionV1 = {
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
    expect(digestAuthoritativeStateProjectionV1(reversed)).toBe(digestAuthoritativeStateProjectionV1(projection));
    expect(digestAiWorldProjectionV1(reversed)).toBe(digestAiWorldProjectionV1(projection));
    expect(digestAuthoritativeStateProjectionV1(projection)).toBe(
      legacyDjb2("a:state|b:state#1:state|2:state#1:a|2:z#mission#rng")
    );
  });

  it("reports an injected actor divergence at its first normalized path", () => {
    const changed = {
      ...projection,
      actors: projection.actors.map((actor) => (actor.actorId === "b" ? { ...actor, digest: "b:changed" } : actor))
    };
    expect(findFirstAuthoritativeStateDifferenceV1(projection, changed)?.path).toBe("$.actors[1].digest");
  });

  it("reports an injected AI continuation at its normalized nested field", () => {
    const changed = {
      ...projection,
      actors: projection.actors.map((actor) =>
        actor.actorId === "b" ? { ...actor, aiState: { spell: { remainingCooldown: 100 } } } : actor
      )
    };
    expect(findFirstAuthoritativeStateDifferenceV1(projection, changed)?.path).toBe(
      "$.actors[1].aiState.spell.remainingCooldown"
    );
  });
});

function legacyDjb2(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 33) ^ value.charCodeAt(index);
  return (hash >>> 0).toString(16).padStart(8, "0");
}
