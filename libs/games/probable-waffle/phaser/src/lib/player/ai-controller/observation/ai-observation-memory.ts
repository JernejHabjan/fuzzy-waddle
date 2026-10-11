import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiObservationMemoryStateData } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiObservedActorV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { knownValue, unknownValue } from "./ai-observation-values";

const MAX_INVALIDATION_DEBT = 1024;
const MAX_REMEMBERED_CONTACTS = 512;
const CONTACT_MEMORY_TICKS = 1200;
const MEMORY_DECAY_PER_TICK = 1;

export type RememberedContact = AiObservationMemoryStateData["contacts"][number];

export function projectRememberedContacts(
  memory: Map<ActorId, RememberedContact>,
  visibleIds: ReadonlySet<ActorId>,
  tick: number
): AiObservedActorV1[] {
  const remembered: AiObservedActorV1[] = [];
  for (const contact of memory.values()) {
    if (visibleIds.has(contact.actorId)) continue;
    const elapsed = Math.max(0, tick - contact.lastSeenTick);
    if (isRememberedContactExpired(contact.lastSeenTick, tick)) {
      memory.delete(contact.actorId);
      continue;
    }
    const confidencePermille = decayObservationConfidence(contact.confidencePermille, elapsed);
    memory.set(contact.actorId, { ...contact, confidencePermille });
    const position = contact.position
      ? knownValue({ ...contact.position }, contact.lastSeenTick)
      : unknownValue("not_observed");
    remembered.push({
      actorId: contact.actorId,
      objectName: contact.objectName,
      owner: contact.owner,
      relation: contact.relation,
      visibility: "last_seen",
      evidenceId: contact.evidenceId as AiObservedActorV1["evidenceId"],
      observedTick: contact.lastSeenTick,
      logicalPosition: position,
      accessNodeId: unknownValue("query_pending"),
      effectiveLevel: unknownValue("not_observed"),
      capabilities: [],
      queue: unknownValue("not_observed"),
      cost: unknownValue("not_observed"),
      housingCost: unknownValue("not_observed"),
      housingCapacity: unknownValue("not_observed"),
      resourceState: unknownValue("not_observed"),
      activeEffectIds: []
    });
  }
  return remembered
    .filter((actor) => actor.relation !== "self")
    .sort((left, right) => left.actorId.localeCompare(right.actorId));
}

export function trimRememberedContacts(memory: Map<ActorId, RememberedContact>): void {
  const overflow = memory.size - MAX_REMEMBERED_CONTACTS;
  if (overflow <= 0) return;
  [...memory.values()]
    .sort((left, right) => left.lastSeenTick - right.lastSeenTick || left.actorId.localeCompare(right.actorId))
    .slice(0, overflow)
    .forEach((contact) => memory.delete(contact.actorId));
}

/** Applies bounded evidence decay without manufacturing a new independent sighting. */
export function decayObservationConfidence(confidencePermille: number, elapsedTicks: number): number {
  return Math.max(0, Math.min(1000, confidencePermille - Math.max(0, elapsedTicks) * MEMORY_DECAY_PER_TICK));
}

/** A last-seen hypothesis expires on the same logical-tick boundary after save/load. */
export function isRememberedContactExpired(lastSeenTick: number, currentTick: number): boolean {
  return Math.max(0, currentTick - lastSeenTick) > CONTACT_MEMORY_TICKS;
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidRememberedContact(contact: unknown): contact is RememberedContact {
  if (!isRecord(contact)) return false;
  const { actorId, objectName, owner, evidenceId, lastSeenTick, confidencePermille, relation, position } = contact;
  if (
    typeof actorId !== "string" ||
    typeof objectName !== "string" ||
    (owner !== null && (typeof owner !== "number" || !isNonNegativeInteger(owner))) ||
    typeof evidenceId !== "string" ||
    typeof lastSeenTick !== "number" ||
    !isNonNegativeInteger(lastSeenTick) ||
    typeof confidencePermille !== "number" ||
    !isNonNegativeInteger(confidencePermille) ||
    confidencePermille > 1000 ||
    typeof relation !== "string" ||
    !["self", "ally", "neutral", "enemy"].includes(relation)
  ) {
    return false;
  }
  return (
    position === null ||
    (isRecord(position) &&
      [position.x, position.y, position.z].every(
        (coordinate) => typeof coordinate === "number" && Number.isFinite(coordinate)
      ))
  );
}

/** Normalizes persistence input so duplicate or malformed contacts cannot change a restored decision. */
export function normalizeAiObservationMemoryState(value: unknown): AiObservationMemoryStateData | undefined {
  if (!isRecord(value) || value.schemaVersion !== 1) return undefined;
  const {
    generation,
    committedTick,
    knowledgeRevision,
    queryInputRevision,
    queryContinuationCursor,
    invalidationDebt
  } = value;
  const fields = [
    generation,
    committedTick,
    knowledgeRevision,
    queryInputRevision,
    queryContinuationCursor,
    invalidationDebt
  ];
  if (!fields.every((field) => typeof field === "number" && isNonNegativeInteger(field))) return undefined;
  if (!Array.isArray(value.contacts)) return undefined;

  const contactsById = new Map<ActorId, RememberedContact>();
  for (const contact of value.contacts) {
    if (!isValidRememberedContact(contact)) continue;
    const existing = contactsById.get(contact.actorId);
    if (
      !existing ||
      contact.lastSeenTick > existing.lastSeenTick ||
      (contact.lastSeenTick === existing.lastSeenTick && contact.confidencePermille > existing.confidencePermille)
    ) {
      contactsById.set(contact.actorId, cloneRememberedContact(contact));
    }
  }
  const contacts = [...contactsById.values()]
    .sort((left, right) => left.lastSeenTick - right.lastSeenTick || left.actorId.localeCompare(right.actorId))
    .slice(-MAX_REMEMBERED_CONTACTS)
    .sort((left, right) => left.actorId.localeCompare(right.actorId));
  return {
    schemaVersion: 1,
    generation: generation as number,
    committedTick: committedTick as number,
    knowledgeRevision: knowledgeRevision as number,
    queryInputRevision: queryInputRevision as number,
    queryContinuationCursor: queryContinuationCursor as number,
    invalidationDebt: Math.min(MAX_INVALIDATION_DEBT, invalidationDebt as number),
    contacts
  };
}

export function cloneRememberedContact(contact: RememberedContact): RememberedContact {
  return {
    ...contact,
    position: contact.position ? { ...contact.position } : null
  };
}
