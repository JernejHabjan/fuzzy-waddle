import type { NativeWorldSetupContext } from "../../../contracts/scenarios/native-world-setup-context.ts";
import { tile } from "../native-world-geometry.ts";

/** Applies the original family controls before the runtime validates and seals the preset. */
export function configureNativeCombatControls(context: NativeWorldSetupContext): void {
  const { id, faction, branch, world, attack, loss } = context;

  if (id === "FIGHT-01" && branch === "support_loss") loss("support-probe", 400);
  if (id === "FIGHT-01" && branch === "completed") loss("contact-group", 400);
  if (id === "FIGHT-05" && branch === "target_loss") loss("contact-group", 200);
  if (id === "FIGHT-02") {
    world.healthStarts = [{ fixtureActorId: "ranged-probe", healthPermille: 400, armourPermille: 0 }];
    attack("contact-group", "ranged-probe", 200);
  }
  if (id === "FIGHT-04") configureSupportWorld(world, faction, branch);
  if (id === "FIGHT-05" && ["stun", "slow"].includes(branch)) {
    const spellType = branch === "stun" ? "snowstorm" : "frostNova";
    const researchType = branch === "stun" ? "snowstormSpell" : "frostNovaSpell";
    // The opponent's caster dies early in this live fight. Complete research before the first tick so
    // the scripted native cast can test status application before combat removes its producer.
    world.completedResearch = [{ playerNumber: 1, researchType }];
    world.resourceGrants = [{ playerNumber: 1, amounts: { minerals: 1000, wood: 1000 } }];
    world.controls.push({
      id: "native-status",
      producerFixtureActorId: "enemy-caster",
      requestTick: 20,
      applicationTick: 20,
      action: { kind: "cast", spellType, targetFixtureActorId: "ranged-probe" }
    });
  }
  if (id === "FIGHT-05" && branch === "wall")
    world.controls.push({
      id: "block-route",
      producerFixtureActorId: "enemy-worker",
      requestTick: 400,
      applicationTick: 400,
      action: { kind: "construct", actorName: "Wall", worldPosition: tile(27, 27) }
    });
}

/** Preset the ability as completed; this scenario measures native tactical effects, not research-economy timing. */
function configureSupportWorld(world, faction, branch) {
  const spell =
    branch === "zone"
      ? "firestormSpell"
      : branch === "support_expiry"
        ? "healingTotemSpell"
        : faction === "Tivara"
          ? "healingRainSpell"
          : "healingLightSpell";
  world.resourceGrants = [{ playerNumber: 2, amounts: { minerals: 1000, wood: 1000, stone: 1000 } }];
  world.completedResearch = [{ playerNumber: 2, researchType: spell }];
  world.healthStarts = [
    { fixtureActorId: "ranged-probe", healthPermille: 350, armourPermille: 0 },
    { fixtureActorId: "contact-group", healthPermille: branch === "overkill" ? 100 : 1000, armourPermille: 0 },
    ...(branch === "healing" || branch === "support_expiry" || branch === "pending_effect"
      ? [{ fixtureActorId: "support-probe", healthPermille: 350, armourPermille: 0 }]
      : [])
  ];
  if (branch === "zone") {
    const target = world.actors.find((actor) => actor.fixtureActorId === "contact-group");
    if (target) target.position = tile(28, 27);
  }
}
