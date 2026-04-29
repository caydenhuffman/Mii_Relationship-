import { RELATIONSHIP_TYPE_METADATA, RELATIONSHIP_TYPES } from "@/config/relationshipMetadata";
import { RELATIONSHIP_STAGE_CONFIG, getStageDefinition } from "@/config/relationshipStages";
import type { Mii, Relationship, RelationshipType } from "@/types/domain";

const RELATIONSHIP_TYPE_PRIORITY: Record<RelationshipType, number> = {
  Spouses: 650,
  Sweethearts: 600,
  Friends: 560,
  Family: 520,
  Relatives: 500,
  Acquaintances: 200,
  Strangers: 0,
  "One-sided love (friend)": 540,
  "One-sided love (acquaintance)": 250,
  "Ex-spouses": -100,
  "Ex-sweethearts": -90,
  "Ex-friends": -80,
};

export function getRelationshipStageLabel(stageKey: string) {
  return getStageDefinition(stageKey)?.label ?? "Unknown stage";
}

export function getRelationshipStageIndex(stageKey: string) {
  const stage = getStageDefinition(stageKey);

  if (!stage) {
    return -1;
  }

  return RELATIONSHIP_STAGE_CONFIG.stagesByType[stage.relationshipType].findIndex(
    (candidate) => candidate.stageKey === stageKey,
  );
}

export function getOutgoingRelationships(miiId: string, relationships: Relationship[]) {
  return relationships.filter((relationship) => relationship.sourceMiiId === miiId);
}

export function getIncomingRelationships(miiId: string, relationships: Relationship[]) {
  return relationships.filter((relationship) => relationship.targetMiiId === miiId);
}

export function getConnectionCount(miiId: string, relationships: Relationship[]) {
  const connectionIds = new Set<string>();

  for (const relationship of relationships) {
    if (relationship.sourceMiiId === miiId) {
      connectionIds.add(relationship.targetMiiId);
    }

    if (relationship.targetMiiId === miiId) {
      connectionIds.add(relationship.sourceMiiId);
    }
  }

  return connectionIds.size;
}

export function buildConnectionCountMap(
  miis: Mii[],
  relationships: Relationship[],
): Map<string, number> {
  const connectionSets = new Map<string, Set<string>>();

  for (const mii of miis) {
    connectionSets.set(mii.id, new Set());
  }

  for (const relationship of relationships) {
    const sourceConnections = connectionSets.get(relationship.sourceMiiId);
    if (sourceConnections) {
      sourceConnections.add(relationship.targetMiiId);
    }

    const targetConnections = connectionSets.get(relationship.targetMiiId);
    if (targetConnections) {
      targetConnections.add(relationship.sourceMiiId);
    }
  }

  return new Map(
    [...connectionSets.entries()].map(([miiId, connectedIds]) => [miiId, connectedIds.size]),
  );
}

export interface MiiRelationshipSummary {
  friendCount: number;
  acquaintanceCount: number;
  familyCount: number;
  spouseCount: number;
  sweetheartCount: number;
}

export function buildMiiRelationshipSummaryMap(
  miis: Mii[],
  relationships: Relationship[],
): Map<string, MiiRelationshipSummary> {
  const summaryMap = new Map<string, MiiRelationshipSummary>();

  for (const mii of miis) {
    summaryMap.set(mii.id, {
      friendCount: 0,
      acquaintanceCount: 0,
      familyCount: 0,
      spouseCount: 0,
      sweetheartCount: 0,
    });
  }

  for (const relationship of relationships) {
    const summary = summaryMap.get(relationship.sourceMiiId);

    if (!summary) {
      continue;
    }

    if (relationship.relationshipType === "Friends") {
      summary.friendCount += 1;
      continue;
    }

    if (relationship.relationshipType === "Acquaintances") {
      summary.acquaintanceCount += 1;
      continue;
    }

    if (
      relationship.relationshipType === "Family" ||
      relationship.relationshipType === "Relatives"
    ) {
      summary.familyCount += 1;
      continue;
    }

    if (relationship.relationshipType === "Spouses") {
      summary.spouseCount += 1;
      continue;
    }

    if (relationship.relationshipType === "Sweethearts") {
      summary.sweetheartCount += 1;
    }
  }

  return summaryMap;
}

export function isPositiveSocialRelationshipType(relationshipType: RelationshipType) {
  return RELATIONSHIP_TYPE_METADATA[relationshipType].positiveSocial;
}

export function buildDashboardSummary(miis: Mii[], relationships: Relationship[]) {
  const countByType = {} as Record<RelationshipType, number>;
  for (const relationshipType of RELATIONSHIP_TYPES) {
    countByType[relationshipType] = 0;
  }
  let positiveSocialCount = 0;
  let exCount = 0;
  let romanceCount = 0;

  for (const relationship of relationships) {
    countByType[relationship.relationshipType] += 1;

    const metadata = RELATIONSHIP_TYPE_METADATA[relationship.relationshipType];
    if (metadata.positiveSocial) {
      positiveSocialCount += 1;
    }
    if (metadata.family === "ex") {
      exCount += 1;
    }
    if (
      relationship.relationshipType === "Spouses" ||
      relationship.relationshipType === "Sweethearts"
    ) {
      romanceCount += 1;
    }
  }

  return {
    totalMiis: miis.length,
    totalRelationships: relationships.length,
    countByType,
    positiveSocialCount,
    exCount,
    romanceCount,
  };
}

export interface RankedRelationship {
  counterparty: Mii;
  outgoingRelationship: Relationship;
  incomingRelationship?: Relationship;
  score: number;
}

export function buildRankedRelationshipsForMii(
  miiId: string,
  miis: Mii[],
  relationships: Relationship[],
): RankedRelationship[] {
  const miiMap = new Map(miis.map((mii) => [mii.id, mii]));
  const reciprocalMap = new Map<string, Relationship>();
  for (const relationship of relationships) {
    reciprocalMap.set(
      `${relationship.sourceMiiId}|${relationship.targetMiiId}`,
      relationship,
    );
  }
  const outgoingRelationships = relationships.filter(
    (relationship) => relationship.sourceMiiId === miiId,
  );
  const rankedRelationships = outgoingRelationships.reduce<RankedRelationship[]>(
    (accumulator, relationship) => {
      const counterparty = miiMap.get(relationship.targetMiiId);

      if (!counterparty) {
        return accumulator;
      }

      const stageIndex = getRelationshipStageIndex(relationship.stageKey);
      const incomingRelationship = reciprocalMap.get(
        `${relationship.targetMiiId}|${relationship.sourceMiiId}`,
      );
      const score =
        RELATIONSHIP_TYPE_PRIORITY[relationship.relationshipType] + Math.max(stageIndex, 0) * 12;

      accumulator.push({
        counterparty,
        outgoingRelationship: relationship,
        incomingRelationship: incomingRelationship?.sourceMiiId === counterparty.id
          ? incomingRelationship
          : undefined,
        score,
      });

      return accumulator;
    },
    [],
  );

  return rankedRelationships.sort(
    (left, right) =>
      right.score - left.score || left.counterparty.name.localeCompare(right.counterparty.name),
  );
}

export interface FriendGroup {
  id: string;
  memberIds: string[];
  members: Mii[];
  mutualLinkCount: number;
  directedRelationshipCount: number;
}

function buildMutualStrongAdjacency(
  relationships: Relationship[],
  options?: { excludeLowStages?: boolean },
) {
  const strongEdges = relationships.filter((relationship) => {
    if (!isPositiveSocialRelationshipType(relationship.relationshipType)) {
      return false;
    }

    if (!options?.excludeLowStages) {
      return true;
    }

    return getRelationshipStageIndex(relationship.stageKey) >= 2;
  });

  const directedPairs = new Set(
    strongEdges.map(
      (relationship) => `${relationship.sourceMiiId}=>${relationship.targetMiiId}`,
    ),
  );
  const adjacency = new Map<string, Set<string>>();

  for (const relationship of strongEdges) {
    const reverseKey = `${relationship.targetMiiId}=>${relationship.sourceMiiId}`;

    if (!directedPairs.has(reverseKey)) {
      continue;
    }

    if (!adjacency.has(relationship.sourceMiiId)) {
      adjacency.set(relationship.sourceMiiId, new Set());
    }

    if (!adjacency.has(relationship.targetMiiId)) {
      adjacency.set(relationship.targetMiiId, new Set());
    }

    adjacency.get(relationship.sourceMiiId)?.add(relationship.targetMiiId);
    adjacency.get(relationship.targetMiiId)?.add(relationship.sourceMiiId);
  }

  return { adjacency, strongEdges };
}

function intersect(left: Set<string>, right: Set<string>) {
  return new Set([...left].filter((value) => right.has(value)));
}

function bronKerbosch(
  currentClique: Set<string>,
  candidateNodes: Set<string>,
  excludedNodes: Set<string>,
  adjacency: Map<string, Set<string>>,
  cliques: string[][],
) {
  if (candidateNodes.size === 0 && excludedNodes.size === 0) {
    if (currentClique.size > 1) {
      cliques.push([...currentClique].sort());
    }
    return;
  }

  for (const node of [...candidateNodes]) {
    const neighbors = adjacency.get(node) ?? new Set<string>();
    const nextClique = new Set(currentClique);
    nextClique.add(node);

    bronKerbosch(
      nextClique,
      intersect(candidateNodes, neighbors),
      intersect(excludedNodes, neighbors),
      adjacency,
      cliques,
    );

    candidateNodes.delete(node);
    excludedNodes.add(node);
  }
}

export function findFriendGroups(
  miis: Mii[],
  relationships: Relationship[],
  options?: { excludeLowStages?: boolean },
) {
  const miiMap = new Map(miis.map((mii) => [mii.id, mii]));
  const { adjacency, strongEdges } = buildMutualStrongAdjacency(relationships, options);
  const cliqueMemberIds: string[][] = [];
  const groups: FriendGroup[] = [];
  const strongEdgesBySource = new Map<string, Relationship[]>();
  for (const relationship of strongEdges) {
    const sourceList = strongEdgesBySource.get(relationship.sourceMiiId) ?? [];
    sourceList.push(relationship);
    strongEdgesBySource.set(relationship.sourceMiiId, sourceList);
  }

  bronKerbosch(
    new Set<string>(),
    new Set(adjacency.keys()),
    new Set<string>(),
    adjacency,
    cliqueMemberIds,
  );

  const uniqueCliques = [...new Set(cliqueMemberIds.map((memberIds) => memberIds.join("|")))].map(
    (cliqueKey) => cliqueKey.split("|"),
  );

  for (const memberIds of uniqueCliques.filter((group) => group.length >= 3)) {
    const mutualLinkCount = memberIds.reduce((count, memberId, index) => {
      const sharedFriends = memberIds.slice(index + 1).filter((otherMemberId) =>
        adjacency.get(memberId)?.has(otherMemberId),
      );
      return count + sharedFriends.length;
    }, 0);

    const memberSet = new Set(memberIds);
    let directedRelationshipCount = 0;

    for (const memberId of memberIds) {
      const outgoing = strongEdgesBySource.get(memberId) ?? [];
      for (const relationship of outgoing) {
        if (memberSet.has(relationship.targetMiiId)) {
          directedRelationshipCount += 1;
        }
      }
    }

    groups.push({
      id: `cluster-${groups.length + 1}`,
      memberIds,
      members: memberIds
        .map((memberId) => miiMap.get(memberId))
        .filter((value): value is Mii => Boolean(value)),
      mutualLinkCount,
      directedRelationshipCount,
    });
  }

  return groups.sort(
    (left, right) =>
      right.members.length - left.members.length ||
      right.mutualLinkCount - left.mutualLinkCount ||
      left.members.map((member) => member.name).join(",").localeCompare(
        right.members.map((member) => member.name).join(","),
      ),
  );
}

export function getFocusedRelationshipIds(
  selectedMiiId: string,
  relationships: Relationship[],
) {
  const includedMiiIds = new Set<string>([selectedMiiId]);

  for (const relationship of relationships) {
    if (
      isPositiveSocialRelationshipType(relationship.relationshipType) &&
      (relationship.sourceMiiId === selectedMiiId || relationship.targetMiiId === selectedMiiId)
    ) {
      includedMiiIds.add(relationship.sourceMiiId);
      includedMiiIds.add(relationship.targetMiiId);
    }
  }

  return includedMiiIds;
}
