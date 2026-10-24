/** Canonical authoritative projection shared by multiplayer hashing and the AI harness. */
export interface AuthoritativeStateProjectionV1 {
  readonly schemaVersion: 1;
  readonly actors: readonly {
    readonly actorId: string;
    readonly digest: string;
    readonly aiState?: Readonly<Record<string, unknown>>;
  }[];
  readonly players: readonly string[];
  readonly research: readonly string[];
  readonly campaignMission: string;
  readonly campaignMissionFamilies: Readonly<Record<string, string>>;
  readonly random: string;
  /** Save-owned command/effect/AI continuations included in AI reports, not the legacy multiplayer digest. */
  readonly systems: Readonly<Record<string, string>>;
}

/** Normalizes set-like projection fields while preserving queue/order content inside each digest. */
export function canonicalizeAuthoritativeStateProjectionV1(
  projection: AuthoritativeStateProjectionV1
): AuthoritativeStateProjectionV1 {
  return {
    ...projection,
    actors: [...projection.actors]
      .map((actor) => ({
        ...actor,
        aiState: actor.aiState ? (canonicalizeUnknown(actor.aiState) as Readonly<Record<string, unknown>>) : undefined
      }))
      .sort((left, right) => left.digest.localeCompare(right.digest)),
    players: [...projection.players].sort(),
    research: [...projection.research].sort(),
    campaignMissionFamilies: Object.fromEntries(
      Object.entries(projection.campaignMissionFamilies).sort(([a], [b]) => a.localeCompare(b))
    ),
    systems: Object.fromEntries(Object.entries(projection.systems).sort(([a], [b]) => a.localeCompare(b)))
  };
}

/** Existing multiplayer-compatible DJB2 digest over the reusable canonical projection. */
export function digestAuthoritativeStateProjectionV1(projection: AuthoritativeStateProjectionV1): string {
  const canonical = canonicalizeAuthoritativeStateProjectionV1(projection);
  return djb2(
    `${canonical.actors.map((actor) => actor.digest).join("|")}#${canonical.players.join("|")}#${canonical.research.join("|")}#${canonical.campaignMission}#${canonical.random}`
  );
}

/** Stable FNV digest dedicated to AI scenario reports; it does not replace multiplayer hash compatibility. */
export function digestAiWorldProjectionV1(projection: AuthoritativeStateProjectionV1): string {
  const serialized = JSON.stringify(canonicalizeAuthoritativeStateProjectionV1(projection));
  let hash = 0x811c9dc5;
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

/** First normalized world difference for retained harness artifacts. */
export function findFirstAuthoritativeStateDifferenceV1(
  expected: AuthoritativeStateProjectionV1,
  actual: AuthoritativeStateProjectionV1
): { readonly path: string; readonly expected: unknown; readonly actual: unknown } | null {
  return walk(
    canonicalizeAuthoritativeStateProjectionV1(expected),
    canonicalizeAuthoritativeStateProjectionV1(actual),
    "$"
  );
}

function walk(
  expected: unknown,
  actual: unknown,
  path: string
): { path: string; expected: unknown; actual: unknown } | null {
  if (Object.is(expected, actual)) return null;
  if (Array.isArray(expected) && Array.isArray(actual)) {
    for (let index = 0; index < Math.max(expected.length, actual.length); index += 1) {
      const difference = walk(expected[index], actual[index], `${path}[${index}]`);
      if (difference) return difference;
    }
    return null;
  }
  if (isRecord(expected) && isRecord(actual)) {
    for (const key of [...new Set([...Object.keys(expected), ...Object.keys(actual)])].sort()) {
      const difference = walk(expected[key], actual[key], `${path}.${key}`);
      if (difference) return difference;
    }
    return null;
  }
  return { path, expected, actual };
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function canonicalizeUnknown(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeUnknown);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => [key, canonicalizeUnknown(child)])
  );
}

function djb2(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 33) ^ value.charCodeAt(index);
  return (hash >>> 0).toString(16).padStart(8, "0");
}
