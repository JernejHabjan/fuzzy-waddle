import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

const DEFAULT_PROJECTS = [
  "libs/games/probable-waffle/phaser",
  "libs/games/little-muncher/gameplay",
  "libs/games/fly-squasher/gameplay",
  "libs/games/dungeon-crawler/gameplay"
];

const requestedProjects = process.argv.slice(2);
const projectRoots = (requestedProjects.length > 0 ? requestedProjects : DEFAULT_PROJECTS).map((projectPath) =>
  resolve(projectPath)
);
const errors = [];

function listFiles(directory) {
  if (!existsSync(directory)) return [];

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = join(directory, entry.name);
    return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
  });
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push(`${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

function visit(value, visitor) {
  if (Array.isArray(value)) {
    for (const item of value) visit(item, visitor);
    return;
  }
  if (!value || typeof value !== "object") return;

  visitor(value);
  for (const child of Object.values(value)) visit(child, visitor);
}

function valuesOf(value) {
  if (typeof value === "string") return [value];
  return Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];
}

function projectRelative(projectRoot, filePath) {
  return relative(projectRoot, filePath).split(sep).join("/");
}

function publicFilePath(publicRoot, url) {
  if (isAbsolute(url) || url.startsWith("../") || url.includes("/../")) return undefined;

  const filePath = resolve(publicRoot, url);
  const relativePath = relative(publicRoot, filePath);
  return relativePath.startsWith("..") || isAbsolute(relativePath) ? undefined : filePath;
}

function packEntries(pack) {
  return Object.values(pack).flatMap((section) =>
    section && typeof section === "object" && Array.isArray(section.files) ? section.files : []
  );
}

function validateProject(projectRoot) {
  const sourceRoot = join(projectRoot, "src");
  const publicRootMarker = join(sourceRoot, "publicroot");
  const files = listFiles(sourceRoot);
  const sceneFiles = files.filter((filePath) => filePath.endsWith(".scene"));
  const packFiles = files.filter(
    (filePath) => filePath.endsWith(".json") && basename(filePath).toLowerCase().includes("asset-pack")
  );
  const projectErrorsBefore = errors.length;

  if (!existsSync(publicRootMarker)) {
    errors.push(`${projectRoot}: missing src/publicroot`);
  }

  const ids = new Set();
  const prefabReferences = [];
  const textureReferences = [];

  for (const sceneFile of sceneFiles) {
    if (!existsSync(sceneFile.replace(/\.scene$/, ".ts"))) {
      errors.push(`${projectRelative(projectRoot, sceneFile)}: missing paired TypeScript file`);
    }

    const scene = readJson(sceneFile);
    if (!scene) continue;

    visit(scene, (value) => {
      if (typeof value.id === "string") ids.add(value.id);
      if (typeof value.prefabId === "string") {
        prefabReferences.push({ filePath: sceneFile, prefabId: value.prefabId });
      }
      if (value.texture && typeof value.texture === "object" && typeof value.texture.key === "string") {
        textureReferences.push({
          filePath: sceneFile,
          key: value.texture.key,
          frame: value.texture.frame
        });
      }
    });
  }

  for (const reference of prefabReferences) {
    if (!ids.has(reference.prefabId)) {
      errors.push(
        `${projectRelative(projectRoot, reference.filePath)}: unresolved prefabId "${reference.prefabId}"`
      );
    }
  }

  const assetsByKey = new Map();
  let assetUrlCount = 0;

  for (const packFile of packFiles) {
    const pack = readJson(packFile);
    if (!pack) continue;

    for (const entry of packEntries(pack)) {
      if (!entry || typeof entry !== "object") continue;

      const urls = [...valuesOf(entry.url), ...valuesOf(entry.jsonURL), ...valuesOf(entry.audioURL)];
      assetUrlCount += urls.length;

      for (const url of urls) {
        const filePath = publicFilePath(sourceRoot, url);
        if (!filePath) {
          errors.push(`${projectRelative(projectRoot, packFile)}: asset URL escapes src/publicroot: "${url}"`);
        } else if (!existsSync(filePath)) {
          errors.push(`${projectRelative(projectRoot, packFile)}: missing asset URL "${url}"`);
        }
      }

      if (typeof entry.path === "string") {
        const entryPath = publicFilePath(sourceRoot, entry.path);
        if (!entryPath || !existsSync(entryPath)) {
          errors.push(`${projectRelative(projectRoot, packFile)}: missing asset path "${entry.path}"`);
        }
      }

      if (typeof entry.key !== "string") continue;

      const asset = {
        type: entry.type,
        frames: undefined
      };

      if (entry.type === "audioSprite" && typeof entry.jsonURL === "string") {
        const audioSpritePath = publicFilePath(sourceRoot, entry.jsonURL);
        const audioSprite =
          audioSpritePath && existsSync(audioSpritePath) ? readJson(audioSpritePath) : undefined;

        if (audioSprite && Array.isArray(audioSprite.resources)) {
          for (const resource of audioSprite.resources) {
            if (typeof resource !== "string") continue;
            const resourcePath = publicFilePath(sourceRoot, resource);
            if (!resourcePath || !existsSync(resourcePath)) {
              errors.push(
                `${projectRelative(projectRoot, audioSpritePath)}: missing audio resource "${resource}"`
              );
            }
          }
        }
      }

      if (entry.type === "multiatlas" && typeof entry.url === "string") {
        const atlasPath = publicFilePath(sourceRoot, entry.url);
        const atlas = atlasPath && existsSync(atlasPath) ? readJson(atlasPath) : undefined;
        const frames = new Set();

        if (atlas && Array.isArray(atlas.textures)) {
          const imageRoot =
            typeof entry.path === "string"
              ? publicFilePath(sourceRoot, entry.path)
              : publicFilePath(sourceRoot, dirname(entry.url));

          for (const texture of atlas.textures) {
            if (typeof texture.image === "string" && imageRoot && !existsSync(join(imageRoot, texture.image))) {
              errors.push(
                `${projectRelative(projectRoot, atlasPath)}: missing atlas image "${join(
                  projectRelative(projectRoot, imageRoot),
                  texture.image
                )}"`
              );
            }
            if (!Array.isArray(texture.frames)) continue;
            for (const frame of texture.frames) {
              if (typeof frame.filename === "string") frames.add(frame.filename);
            }
          }
        }

        asset.frames = frames;
      }

      if (entry.type === "tilemapTiledJSON" && typeof entry.url === "string") {
        const tilemapPath = publicFilePath(sourceRoot, entry.url);
        const tilemap = tilemapPath && existsSync(tilemapPath) ? readJson(tilemapPath) : undefined;

        if (tilemap && Array.isArray(tilemap.tilesets)) {
          for (const tileset of tilemap.tilesets) {
            for (const tilesetReference of [tileset.image, tileset.source]) {
              if (
                typeof tilesetReference === "string" &&
                !existsSync(resolve(dirname(tilemapPath), tilesetReference))
              ) {
                errors.push(
                  `${projectRelative(projectRoot, tilemapPath)}: missing tileset resource "${tilesetReference}"`
                );
              }
            }
          }
        }
      }

      assetsByKey.set(entry.key, asset);
    }
  }

  for (const reference of textureReferences) {
    const asset = assetsByKey.get(reference.key);
    if (!asset) {
      errors.push(
        `${projectRelative(projectRoot, reference.filePath)}: texture key "${reference.key}" is absent from asset packs`
      );
      continue;
    }

    if (asset.frames && typeof reference.frame === "string" && !asset.frames.has(reference.frame)) {
      errors.push(
        `${projectRelative(projectRoot, reference.filePath)}: frame "${reference.frame}" is absent from atlas "${reference.key}"`
      );
    }
  }

  const projectErrorCount = errors.length - projectErrorsBefore;
  console.log(
    `[phaser-editor] ${projectRelative(process.cwd(), projectRoot)}: ${packFiles.length} pack(s), ` +
      `${assetUrlCount} asset URL(s), ${sceneFiles.length} scene(s), ${prefabReferences.length} prefab reference(s), ` +
      `${textureReferences.length} texture reference(s), ${projectErrorCount} error(s)`
  );
}

for (const projectRoot of projectRoots) validateProject(projectRoot);

if (errors.length > 0) {
  console.error("\n[phaser-editor:ERROR] Self-contained project validation failed:");
  for (const error of errors) console.error(`[phaser-editor:ERROR] ${error}`);
  process.exitCode = 1;
} else {
  console.log("[phaser-editor] All selected projects are self-contained.");
}
