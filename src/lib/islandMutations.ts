import type {
  IslandData,
  Mii,
  MiiInput,
  Relationship,
  RelationshipInput,
  RelationshipPairInput,
} from "@/types/domain";

function timestamp() {
  return new Date().toISOString();
}

function withUpdatedAt(data: IslandData): IslandData {
  return {
    ...data,
    updatedAt: timestamp(),
  };
}

function isSamePair(
  relationship: Relationship,
  leftMiiId: string,
  rightMiiId: string,
) {
  return (
    (relationship.sourceMiiId === leftMiiId && relationship.targetMiiId === rightMiiId) ||
    (relationship.sourceMiiId === rightMiiId && relationship.targetMiiId === leftMiiId)
  );
}

function assertValidRelationshipPairInput(input: RelationshipPairInput) {
  if (input.sourceMiiId === input.targetMiiId) {
    throw new Error("A Mii can't have a relationship with themself.");
  }
}

function assertPairIsUnique(
  relationships: Relationship[],
  input: RelationshipPairInput,
  ignoredRelationshipIds: string[] = [],
) {
  const ignoredIds = new Set(ignoredRelationshipIds);
  const existingPair = relationships.find(
    (relationship) =>
      !ignoredIds.has(relationship.id) &&
      isSamePair(relationship, input.sourceMiiId, input.targetMiiId),
  );

  if (existingPair) {
    throw new Error("These two Miis already have a relationship pair. Edit it instead.");
  }
}

export function addMiiToIsland(data: IslandData, input: MiiInput): IslandData {
  const now = timestamp();
  const nextMii: Mii = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    personalityType: input.personalityType,
    level: input.level,
    createdAt: now,
    updatedAt: now,
  };

  return withUpdatedAt({
    ...data,
    miis: [...data.miis, nextMii],
  });
}

export function updateMiiInIsland(
  data: IslandData,
  miiId: string,
  input: MiiInput,
): IslandData {
  return withUpdatedAt({
    ...data,
    miis: data.miis.map((mii) =>
      mii.id === miiId
        ? {
            ...mii,
            name: input.name.trim(),
            personalityType: input.personalityType,
            level: input.level,
            updatedAt: timestamp(),
          }
        : mii,
    ),
  });
}

export function deleteMiiFromIsland(data: IslandData, miiId: string): IslandData {
  return withUpdatedAt({
    ...data,
    miis: data.miis.filter((mii) => mii.id !== miiId),
    relationships: data.relationships.filter(
      (relationship) =>
        relationship.sourceMiiId !== miiId && relationship.targetMiiId !== miiId,
    ),
  });
}

export function addRelationshipToIsland(
  data: IslandData,
  input: RelationshipInput,
): IslandData {
  const now = timestamp();
  const nextRelationship: Relationship = {
    id: crypto.randomUUID(),
    sourceMiiId: input.sourceMiiId,
    targetMiiId: input.targetMiiId,
    relationshipType: input.relationshipType,
    stageKey: input.stageKey,
    createdAt: now,
    updatedAt: now,
  };

  return withUpdatedAt({
    ...data,
    relationships: [...data.relationships, nextRelationship],
  });
}

export function findReciprocalRelationship(
  relationships: Relationship[],
  relationship: Relationship,
) {
  if (relationship.pairId) {
    const pairedMatch = relationships.find(
      (candidate) =>
        candidate.id !== relationship.id && candidate.pairId === relationship.pairId,
    );

    if (pairedMatch) {
      return pairedMatch;
    }
  }

  return relationships.find(
    (candidate) =>
      candidate.id !== relationship.id &&
      candidate.sourceMiiId === relationship.targetMiiId &&
      candidate.targetMiiId === relationship.sourceMiiId,
  );
}

export function addRelationshipPairToIsland(
  data: IslandData,
  input: RelationshipPairInput,
): IslandData {
  assertValidRelationshipPairInput(input);
  assertPairIsUnique(data.relationships, input);

  const now = timestamp();
  const pairId = crypto.randomUUID();

  const pair: Relationship[] = [
    {
      id: crypto.randomUUID(),
      pairId,
      sourceMiiId: input.sourceMiiId,
      targetMiiId: input.targetMiiId,
      relationshipType: input.relationshipType,
      stageKey: input.stageKey,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      pairId,
      sourceMiiId: input.targetMiiId,
      targetMiiId: input.sourceMiiId,
      relationshipType: input.inverseRelationshipType,
      stageKey: input.inverseStageKey,
      createdAt: now,
      updatedAt: now,
    },
  ];

  return withUpdatedAt({
    ...data,
    relationships: [...data.relationships, ...pair],
  });
}

export function updateRelationshipInIsland(
  data: IslandData,
  relationshipId: string,
  input: RelationshipInput,
): IslandData {
  return withUpdatedAt({
    ...data,
    relationships: data.relationships.map((relationship) =>
      relationship.id === relationshipId
        ? {
            ...relationship,
            sourceMiiId: input.sourceMiiId,
            targetMiiId: input.targetMiiId,
            relationshipType: input.relationshipType,
            stageKey: input.stageKey,
            updatedAt: timestamp(),
          }
        : relationship,
    ),
  });
}

export function updateRelationshipPairInIsland(
  data: IslandData,
  relationshipId: string,
  input: RelationshipPairInput,
): IslandData {
  assertValidRelationshipPairInput(input);

  const relationship = data.relationships.find((entry) => entry.id === relationshipId);

  if (!relationship) {
    return data;
  }

  const reciprocalRelationship = findReciprocalRelationship(data.relationships, relationship);
  assertPairIsUnique(
    data.relationships,
    input,
    reciprocalRelationship
      ? [relationship.id, reciprocalRelationship.id]
      : [relationship.id],
  );
  const now = timestamp();
  const pairId = relationship.pairId ?? reciprocalRelationship?.pairId ?? crypto.randomUUID();

  const remainingRelationships = data.relationships.filter(
    (entry) =>
      entry.id !== relationship.id &&
      (!reciprocalRelationship || entry.id !== reciprocalRelationship.id),
  );

  const nextRelationships: Relationship[] = [
    ...remainingRelationships,
    {
      ...relationship,
      pairId,
      sourceMiiId: input.sourceMiiId,
      targetMiiId: input.targetMiiId,
      relationshipType: input.relationshipType,
      stageKey: input.stageKey,
      updatedAt: now,
    },
    {
      ...(reciprocalRelationship ?? {
        id: crypto.randomUUID(),
        createdAt: now,
      }),
      pairId,
      sourceMiiId: input.targetMiiId,
      targetMiiId: input.sourceMiiId,
      relationshipType: input.inverseRelationshipType,
      stageKey: input.inverseStageKey,
      createdAt: reciprocalRelationship?.createdAt ?? now,
      updatedAt: now,
    },
  ];

  return withUpdatedAt({
    ...data,
    relationships: nextRelationships,
  });
}

export function deleteRelationshipFromIsland(
  data: IslandData,
  relationshipId: string,
): IslandData {
  return withUpdatedAt({
    ...data,
    relationships: data.relationships.filter(
      (relationship) => relationship.id !== relationshipId,
    ),
  });
}

export function deleteRelationshipPairFromIsland(
  data: IslandData,
  relationshipId: string,
): IslandData {
  const relationship = data.relationships.find((entry) => entry.id === relationshipId);

  if (!relationship) {
    return data;
  }

  const reciprocalRelationship = findReciprocalRelationship(data.relationships, relationship);

  return withUpdatedAt({
    ...data,
    relationships: data.relationships.filter(
      (entry) =>
        entry.id !== relationship.id &&
        (!reciprocalRelationship || entry.id !== reciprocalRelationship.id),
    ),
  });
}
