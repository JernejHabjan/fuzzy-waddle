import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const contract = JSON.parse(readFileSync(resolve(root, "tools/ai/fixtures/test-map-topology.json"), "utf8"));

function frozenJson(path, expectedDigest) {
  const content = readFileSync(resolve(root, path));
  assert.equal(createHash("sha256").update(content).digest("hex"), expectedDigest, `${path} changed intentionally?`);
  return JSON.parse(content.toString("utf8"));
}

test("the open-economy scene has only two owned spawns and symmetric neutral resources", () => {
  const map = contract.maps.find((candidate) => candidate.id === "ai-open-economy");
  assert.ok(map);
  const scene = frozenJson(map.scene, map.sceneSha256);
  const tilemap = frozenJson(map.tilemap, map.tilemapSha256);
  const pack = frozenJson(`${map.assetPackDirectory}/${map.assetPack}`, map.assetPackSha256);
  assert.equal(scene.settings.sceneKey, "MapAiOpenEconomy");
  assert.deepEqual(scene.displayList.filter((entry) => entry["EditorOwner.owner_id"]).map((entry) =>
    entry["EditorOwner.owner_id"]), ["1", "2"]);
  assert.deepEqual(scene.displayList.map((entry) => entry.label).sort(), [
    "tilemap_level_1", "spawn_1", "spawn_2", "tree_west_1", "tree_west_2", "stone_west",
    "minerals_west", "tree_east_1", "tree_east_2", "stone_east", "minerals_east"
  ].sort());
  const objects = new Map(scene.displayList.map((entry) => [entry.label, entry]));
  for (const label of ["spawn_1", "spawn_2"]) {
    assert.equal(objects.get(label).prefabId, "c91c72f2-a5b5-4fea-abde-27ebfc228ae5");
  }
  for (const label of ["tree_west_1", "tree_west_2", "tree_east_1", "tree_east_2"]) {
    assert.equal(objects.get(label).prefabId, "ec58b20e-e04f-4bd4-8401-856e1e433f46");
  }
  for (const label of ["stone_west", "stone_east"]) {
    assert.equal(objects.get(label).prefabId, "e208af37-5101-4cbf-adca-93d59373fc09");
  }
  for (const label of ["minerals_west", "minerals_east"]) {
    assert.equal(objects.get(label).prefabId, "3ffd00fc-90c4-4b37-b00e-9cf62e16c80c");
  }
  assert.equal(tilemap.width, 50);
  assert.equal(tilemap.height, 50);
  assert.equal(tilemap.layers.length, 1);
  assert.equal(tilemap.layers[0].data.length, 2500);
  assert.deepEqual([...new Set(tilemap.layers[0].data)], [12]);
  const grass = tilemap.tilesets[0].tiles.find((entry) => entry.id === 11);
  assert.ok(grass.properties.some((property) => property.name === "terrainType" && property.value === "grass"));
  assert.equal(scene.plainObjects[0].key, "tiles_ai_open_economy");
  assert.equal(pack.section1.files[0].key, "tiles_ai_open_economy");
});
