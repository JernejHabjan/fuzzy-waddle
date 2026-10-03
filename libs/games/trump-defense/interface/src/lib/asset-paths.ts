import type { LevelDefinition } from "@fuzzy-waddle/trump-defense-gameplay";

/** document.baseURI respects the portal's deployed base href. */
export const assetUrl = (path: string): string => new URL(`assets/trump-defense/${path}`, document.baseURI).href;

function isBundledLevel(value: unknown, id: number): value is LevelDefinition {
  if (!value || typeof value !== "object") return false;
  const level = value as Partial<LevelDefinition>;
  return (
    level.version === 1 &&
    level.id === id &&
    !!level.scene?.terrain &&
    !!level.scene?.buildableTile &&
    Array.isArray(level.paths?.ground) &&
    Array.isArray(level.paths?.flying) &&
    Array.isArray(level.scene?.props) &&
    Array.isArray(level.scene?.skybox) &&
    !!level.rules &&
    typeof level.music === "string"
  );
}

/** Shipped JSON is fully checked by Jest/Ajv; this guard catches stale or failed deployments. */
export async function loadLevel(id: 1 | 2 | 3): Promise<LevelDefinition> {
  const response = await fetch(assetUrl(`levels/level-${id}.json`));
  if (!response.ok) throw new Error(`Level ${id} could not load (${response.status}).`);
  const data: unknown = await response.json();
  if (!isBundledLevel(data, id)) throw new Error(`Level ${id} has an unsupported or incomplete format.`);
  return data;
}
