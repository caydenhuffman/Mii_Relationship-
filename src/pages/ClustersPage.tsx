import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { RELATIONSHIP_TYPE_METADATA } from "@/config/relationshipMetadata";
import { findFriendGroups, getRelationshipStageLabel, getRelationshipStageIndex } from "@/lib/analytics";
import { useIsland } from "@/hooks/useIsland";
import { ClusterOverviewGraph } from "@/components/graphs/ClusterOverviewGraph";
import type { Relationship } from "@/types/domain";
import pageStyles from "./Page.module.css";

function formatClusterName(names: string[]) {
  if (names.length <= 2) {
    return names.join(" and ");
  }

  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}

export function ClustersPage() {
  const { islandData, status } = useIsland();
  const [excludeLowStages, setExcludeLowStages] = useState(false);
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set());
  const groups = useMemo(
    () =>
      findFriendGroups(islandData.miis, islandData.relationships, {
        excludeLowStages,
      }),
    [excludeLowStages, islandData.miis, islandData.relationships],
  );
  const groupedMiiIds = useMemo(
    () => new Set(groups.flatMap((group) => group.memberIds)),
    [groups],
  );
  const lonerCount = islandData.miis.length - groupedMiiIds.size;
  const relationshipsByGroup = useMemo(() => {
    const groupMemberSetById = new Map<string, Set<string>>();
    for (const group of groups) {
      groupMemberSetById.set(group.id, new Set(group.memberIds));
    }
    const map = new Map<string, Relationship[]>(
      groups.map((group) => [group.id, [] as Relationship[]]),
    );

    for (const relationship of islandData.relationships) {
      if (!RELATIONSHIP_TYPE_METADATA[relationship.relationshipType].positiveSocial) {
        continue;
      }

      if (excludeLowStages && getRelationshipStageIndex(relationship.stageKey) < 2) {
        continue;
      }

      for (const [groupId, memberIds] of groupMemberSetById.entries()) {
        if (
          memberIds.has(relationship.sourceMiiId) &&
          memberIds.has(relationship.targetMiiId)
        ) {
          map.get(groupId)?.push(relationship);
        }
      }
    }

    return map;
  }, [excludeLowStages, groups, islandData.relationships]);
  const clusterViewModels = useMemo(
    () =>
      groups.map((group) => {
        const groupRelationships = relationshipsByGroup.get(group.id) ?? [];
        const memberById = new Map(group.members.map((member) => [member.id, member]));
        const outgoingBySourceId = new Map<string, Relationship[]>();

        for (const relationship of groupRelationships) {
          const outgoing = outgoingBySourceId.get(relationship.sourceMiiId) ?? [];
          outgoing.push(relationship);
          outgoingBySourceId.set(relationship.sourceMiiId, outgoing);
        }

        return {
          group,
          clusterName: formatClusterName(group.members.map((member) => member.name)),
          groupRelationships,
          memberById,
          outgoingBySourceId,
        };
      }),
    [groups, relationshipsByGroup],
  );

  if (status === "loading") {
    return <p>Loading island data...</p>;
  }

  const toggleGroupExpanded = (groupId: string) => {
    setExpandedGroupIds((current) => {
      const next = new Set(current);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  return (
    <div className={pageStyles.stack}>
      <div className={pageStyles.pageHeader}>
        <div>
          <h2>Strong relationship clusters</h2>
          <p>
            Each cluster is a 3+ Mii clique built from strong mutual ties. Every Mii shown
            here is strongly connected to every other Mii in that same group.
          </p>
        </div>
      </div>

      <div className={pageStyles.filterRow}>
        <label>
          Cluster strength filter
          <select
            value={excludeLowStages ? "exclude-low" : "all-strong"}
            onChange={(event) => setExcludeLowStages(event.target.value === "exclude-low")}
          >
            <option value="all-strong">Include all strong stages</option>
            <option value="exclude-low">Exclude the first two stages</option>
          </select>
        </label>
      </div>

      <div className={pageStyles.note}>
        Strong ties include Friends, Family, Relatives, Sweethearts, Spouses, and
        one-sided love between friends. Lone Miis right now: {Math.max(lonerCount, 0)}.
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="No clusters yet"
          description="You need at least three Miis who all have strong mutual ties with each other before a cluster will appear here."
        />
      ) : (
        <section className={pageStyles.clusterGrid}>
          {clusterViewModels.map(
            ({ group, clusterName, groupRelationships, memberById, outgoingBySourceId }) => {
            const isExpanded = expandedGroupIds.has(group.id);

            return (
              <Card key={group.id}>
                <div className={pageStyles.sectionTitle}>
                  <div>
                    <h3>{clusterName}</h3>
                    <p>{group.members.length} Miis in this cluster.</p>
                  </div>
                  <div className={pageStyles.sectionTitleActions}>
                    <span className={`${pageStyles.pill} ${pageStyles.clusterStatPill}`}>
                      {group.mutualLinkCount} mutual links
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      className={pageStyles.clusterToggleButton}
                      onClick={() => toggleGroupExpanded(group.id)}
                    >
                      {isExpanded ? "Hide details" : "Show details"}
                    </Button>
                  </div>
                </div>
                <div className={pageStyles.meta}>
                  <span className={pageStyles.tag}>
                    {group.directedRelationshipCount} strong directed ties
                  </span>
                </div>
                <div className={pageStyles.clusterGraphArea}>
                  <ClusterOverviewGraph
                    members={group.members}
                    relationships={groupRelationships}
                  />
                </div>
                {isExpanded && (
                  <div className={pageStyles.clusterDetails}>
                    <div className={pageStyles.clusterMemberGrid}>
                      {group.members.map((member) => {
                        const outgoingRelationships = outgoingBySourceId.get(member.id) ?? [];

                        return (
                          <div key={member.id} className={pageStyles.item}>
                            <strong>{member.name}</strong>
                            <span className={pageStyles.tag}>
                              {member.personalityType} • Level {member.level}
                            </span>
                            <div className={pageStyles.table}>
                              {outgoingRelationships.map((relationship) => {
                                const targetMember = memberById.get(relationship.targetMiiId);

                                if (!targetMember) {
                                  return null;
                                }

                                const metadata =
                                  RELATIONSHIP_TYPE_METADATA[relationship.relationshipType];

                                return (
                                  <div
                                    key={relationship.id}
                                    className={pageStyles.relationshipSummary}
                                    style={{
                                      background: metadata.surfaceColor,
                                      color: metadata.textColor,
                                    }}
                                  >
                                    <strong>{`→ ${targetMember.name}`}</strong>
                                    <div>
                                      {relationship.relationshipType}:{" "}
                                      {getRelationshipStageLabel(relationship.stageKey)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            );
            },
          )}
        </section>
      )}
    </div>
  );
}
