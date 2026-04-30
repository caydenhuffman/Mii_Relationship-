import { PERSONALITY_GROUPS, getPersonalityGroup } from "@/config/personalities";
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

export interface DashboardRelationshipFamilyStat {
  key: "friends" | "family" | "romance" | "crushes" | "acquaintances" | "exes";
  label: string;
  count: number;
  color: string;
  surfaceColor: string;
  surfaceBorder: string;
  textColor: string;
}

export interface DashboardPersonalityGroupStat {
  group: string;
  count: number;
  percentage: number;
  colorToken: string;
}

export interface DashboardMiiInsight {
  mii: Mii;
  connections: number;
  positiveTies: number;
  friendCount: number;
  closeFriendCount: number;
  familyCount: number;
  romanceCount: number;
  crushCount: number;
  acquaintanceCount: number;
  exCount: number;
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

    if (isFriendLikeRelationshipType(relationship.relationshipType)) {
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

function isFriendLikeRelationshipType(relationshipType: RelationshipType) {
  return (
    relationshipType === "Friends" || relationshipType === "One-sided love (friend)"
  );
}

export function buildDashboardSummary(miis: Mii[], relationships: Relationship[]) {
  const countByType = {} as Record<RelationshipType, number>;
  for (const relationshipType of RELATIONSHIP_TYPES) {
    countByType[relationshipType] = 0;
  }

  const connectionCountMap = buildConnectionCountMap(miis, relationships);
  const insightMap = new Map<string, DashboardMiiInsight>();

  for (const mii of miis) {
    insightMap.set(mii.id, {
      mii,
      connections: connectionCountMap.get(mii.id) ?? 0,
      positiveTies: 0,
      friendCount: 0,
      closeFriendCount: 0,
      familyCount: 0,
      romanceCount: 0,
      crushCount: 0,
      acquaintanceCount: 0,
      exCount: 0,
    });
  }

  let positiveSocialCount = 0;
  let exCount = 0;
  let romanceCount = 0;

  for (const relationship of relationships) {
    countByType[relationship.relationshipType] += 1;

    const metadata = RELATIONSHIP_TYPE_METADATA[relationship.relationshipType];
    const stageIndex = Math.max(getRelationshipStageIndex(relationship.stageKey), 0);
    const insight = insightMap.get(relationship.sourceMiiId);

    if (metadata.positiveSocial) {
      positiveSocialCount += 1;
      insight && (insight.positiveTies += 1);
    }
    if (metadata.family === "ex") {
      exCount += 1;
      insight && (insight.exCount += 1);
    }
    if (
      relationship.relationshipType === "Spouses" ||
      relationship.relationshipType === "Sweethearts"
    ) {
      romanceCount += 1;
      insight && (insight.romanceCount += 1);
    }
    if (isFriendLikeRelationshipType(relationship.relationshipType)) {
      insight && (insight.friendCount += 1);
    }
    if (relationship.relationshipType === "Friends") {
      if (stageIndex >= 2 && insight) {
        insight.closeFriendCount += 1;
      }
    }
    if (
      relationship.relationshipType === "Family" ||
      relationship.relationshipType === "Relatives"
    ) {
      insight && (insight.familyCount += 1);
    }
    if (relationship.relationshipType === "Acquaintances") {
      insight && (insight.acquaintanceCount += 1);
    }
    if (
      relationship.relationshipType === "One-sided love (friend)" ||
      relationship.relationshipType === "One-sided love (acquaintance)"
    ) {
      insight && (insight.crushCount += 1);
    }
  }

  const dashboardInsights = [...insightMap.values()];
  const averageLevel = miis.length
    ? miis.reduce((total, mii) => total + mii.level, 0) / miis.length
    : 0;
  const averageConnections = miis.length
    ? dashboardInsights.reduce((total, entry) => total + entry.connections, 0) / miis.length
    : 0;
  const isolatedMiiCount = dashboardInsights.filter((entry) => entry.connections === 0).length;
  const friendlessCount = dashboardInsights.filter((entry) => entry.friendCount === 0).length;

  const mostConnectedMii = [...dashboardInsights].sort(
    (left, right) =>
      right.connections - left.connections ||
      right.positiveTies - left.positiveTies ||
      left.mii.name.localeCompare(right.mii.name),
  )[0];
  const mostCloseFriendsMii = [...dashboardInsights].sort(
    (left, right) =>
      right.closeFriendCount - left.closeFriendCount ||
      right.friendCount - left.friendCount ||
      left.mii.name.localeCompare(right.mii.name),
  )[0];
  const romanceLeaderMii = [...dashboardInsights].sort(
    (left, right) =>
      right.romanceCount - left.romanceCount ||
      right.crushCount - left.crushCount ||
      left.mii.name.localeCompare(right.mii.name),
  )[0];
  const highestLevelMii = [...miis].sort(
    (left, right) => right.level - left.level || left.name.localeCompare(right.name),
  )[0];

  const personalityGroupBreakdown = PERSONALITY_GROUPS.map((group) => {
    const count = miis.filter(
      (mii) => getPersonalityGroup(mii.personalityType).group === group.group,
    ).length;

    return {
      group: group.group,
      count,
      percentage: miis.length ? count / miis.length : 0,
      colorToken: group.colorToken,
    };
  }).sort((left, right) => right.count - left.count || left.group.localeCompare(right.group));

  const mostCommonPersonalityGroup = personalityGroupBreakdown[0];

  const relationshipFamilyBreakdown: DashboardRelationshipFamilyStat[] = [
    {
      key: "friends",
      label: "Friends",
      count: countByType.Friends,
      color: "var(--edge-friends)",
      surfaceColor: "var(--surface-friends)",
      surfaceBorder: "var(--surface-friends-border)",
      textColor: "var(--surface-friends-text)",
    },
    {
      key: "family",
      label: "Family",
      count: countByType.Family + countByType.Relatives,
      color: "var(--edge-family)",
      surfaceColor: "var(--surface-family)",
      surfaceBorder: "var(--surface-family-border)",
      textColor: "var(--surface-family-text)",
    },
    {
      key: "romance",
      label: "Romance",
      count: countByType.Spouses + countByType.Sweethearts,
      color: "var(--edge-sweethearts)",
      surfaceColor: "var(--surface-sweethearts)",
      surfaceBorder: "var(--surface-sweethearts-border)",
      textColor: "var(--surface-sweethearts-text)",
    },
    {
      key: "crushes",
      label: "Crushes",
      count:
        countByType["One-sided love (friend)"] +
        countByType["One-sided love (acquaintance)"],
      color: "var(--edge-one-sided-friend)",
      surfaceColor: "var(--surface-crush)",
      surfaceBorder: "var(--surface-crush-border)",
      textColor: "var(--surface-crush-text)",
    },
    {
      key: "acquaintances",
      label: "Acquaintances",
      count: countByType.Acquaintances,
      color: "var(--edge-acquaintances)",
      surfaceColor: "var(--surface-acquaintance)",
      surfaceBorder: "var(--surface-acquaintance-border)",
      textColor: "var(--surface-acquaintance-text)",
    },
    {
      key: "exes",
      label: "Exes",
      count: countByType["Ex-spouses"] + countByType["Ex-sweethearts"] + countByType["Ex-friends"],
      color: "var(--edge-exes)",
      surfaceColor: "var(--surface-neutral)",
      surfaceBorder: "var(--surface-neutral-border)",
      textColor: "var(--surface-neutral-text)",
    },
  ];

  const miisNeedingFriends = [...dashboardInsights]
    .sort(
      (left, right) =>
        left.friendCount - right.friendCount ||
        left.closeFriendCount - right.closeFriendCount ||
        left.positiveTies - right.positiveTies ||
        left.connections - right.connections ||
        left.mii.name.localeCompare(right.mii.name),
    )
    .slice(0, Math.min(4, dashboardInsights.length));

  return {
    totalMiis: miis.length,
    totalRelationships: relationships.length,
    countByType,
    positiveSocialCount,
    exCount,
    romanceCount,
    averageLevel,
    averageConnections,
    isolatedMiiCount,
    friendlessCount,
    mostConnectedMii,
    mostCloseFriendsMii,
    romanceLeaderMii,
    highestLevelMii,
    mostCommonPersonalityGroup,
    personalityGroupBreakdown,
    relationshipFamilyBreakdown,
    miisNeedingFriends,
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
