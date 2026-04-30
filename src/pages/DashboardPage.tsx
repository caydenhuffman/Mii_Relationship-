import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { buildDashboardSummary, findFriendGroups } from "@/lib/analytics";
import { useIsland } from "@/hooks/useIsland";
import pageStyles from "./Page.module.css";

function formatAverage(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : "0.0";
}

function formatGroupMembers(names: string[]) {
  if (names.length <= 3) {
    return names.join(", ");
  }

  return `${names.slice(0, 3).join(", ")} +${names.length - 3} more`;
}

function getMiiProfilePath(miiId: string) {
  return `/miis/${miiId}`;
}

export function DashboardPage() {
  const { islandData, status } = useIsland();
  const summary = useMemo(
    () => buildDashboardSummary(islandData.miis, islandData.relationships),
    [islandData.miis, islandData.relationships],
  );
  const groups = useMemo(
    () => findFriendGroups(islandData.miis, islandData.relationships),
    [islandData.miis, islandData.relationships],
  );

  const largestGroup = groups[0];
  const clusteredMiiIds = useMemo(
    () => new Set(groups.flatMap((group) => group.memberIds)),
    [groups],
  );
  const clusterlessCount = islandData.miis.filter((mii) => !clusteredMiiIds.has(mii.id)).length;
  const positiveTieShare = summary.totalRelationships
    ? Math.round((summary.positiveSocialCount / summary.totalRelationships) * 100)
    : 0;

  if (status === "loading") {
    return <p>Loading island data...</p>;
  }

  return (
    <div className={pageStyles.stack}>
      <div className={pageStyles.pageHeader}>
        <div>
          <h2>Island dashboard</h2>
          <p>
            Read the island at a glance: who is thriving, who needs more friendship,
            and what kind of social vibe your Miis are building together.
          </p>
        </div>
      </div>

      {summary.totalMiis === 0 ? (
        <EmptyState
          title="Start your island"
          description="Add your first Mii to begin tracking friendships, romances, and all the dramatic directed feelings in between."
          actionLabel="Go to Miis"
          actionTo="/miis"
        />
      ) : null}

      {summary.totalMiis > 0 ? (
        <>
          <section className={pageStyles.cardGrid}>
            <StatCard label="Total Miis" value={summary.totalMiis} accent="var(--accent-lagoon)" />
            <StatCard
              label="Average level"
              value={formatAverage(summary.averageLevel)}
              accent="var(--accent-teal)"
            />
            <StatCard
              label="Avg connections / Mii"
              value={formatAverage(summary.averageConnections)}
              accent="var(--accent-sunset)"
            />
            <StatCard
              label="Positive tie share"
              value={`${positiveTieShare}%`}
              accent="var(--accent-leaf)"
              helper={`${summary.positiveSocialCount} of ${summary.totalRelationships} directed ties`}
            />
            <StatCard
              label="Most common group"
              value={summary.mostCommonPersonalityGroup?.group ?? "None"}
              accent={summary.mostCommonPersonalityGroup?.colorToken}
              helper={
                summary.mostCommonPersonalityGroup
                  ? `${summary.mostCommonPersonalityGroup.count} Mii${summary.mostCommonPersonalityGroup.count === 1 ? "" : "s"}`
                  : undefined
              }
            />
            <StatCard
              label="Largest cluster"
              value={largestGroup ? `${largestGroup.members.length} Miis` : "None"}
              accent="var(--accent-coral)"
              helper={
                largestGroup
                  ? formatGroupMembers(largestGroup.members.map((member) => member.name))
                  : "No 3-person mutual clique yet"
              }
            />
          </section>

          <div className={pageStyles.splitGrid}>
            <Card>
              <div className={pageStyles.sectionTitle}>
                <div>
                  <h3>Island superlatives</h3>
                  <p>The Miis currently shaping the island's social story.</p>
                  <p className={pageStyles.dashboardHelperNote}>
                    Friend totals include <strong>One-sided love (friend)</strong>, while close
                    friends only count exact <strong>Friends</strong> ties above the bottom two
                    friend levels.
                  </p>
                </div>
              </div>
              <div className={pageStyles.dashboardInsightList}>
                {summary.mostConnectedMii ? (
                  <Link
                    className={pageStyles.dashboardLinkCard}
                    to={getMiiProfilePath(summary.mostConnectedMii.mii.id)}
                  >
                    <div className={pageStyles.dashboardInsightCard}>
                      <div className={pageStyles.itemRow}>
                        <div>
                          <h4>Most well connected</h4>
                          <p className={pageStyles.dashboardLeadName}>
                            {summary.mostConnectedMii.mii.name}
                          </p>
                        </div>
                        <span className={pageStyles.pill}>
                          {summary.mostConnectedMii.connections} connections
                        </span>
                      </div>
                      <div className={pageStyles.meta}>
                        <span className={pageStyles.tag}>
                          {summary.mostConnectedMii.positiveTies} positive ties
                        </span>
                        <span className={pageStyles.tag}>
                          {summary.mostConnectedMii.friendCount} friends
                        </span>
                      </div>
                    </div>
                  </Link>
                ) : null}

                {summary.mostCloseFriendsMii ? (
                  <Link
                    className={pageStyles.dashboardLinkCard}
                    to={getMiiProfilePath(summary.mostCloseFriendsMii.mii.id)}
                  >
                    <div className={pageStyles.dashboardInsightCard}>
                      <div className={pageStyles.itemRow}>
                        <div>
                          <h4>Most close friends</h4>
                          <p className={pageStyles.dashboardLeadName}>
                            {summary.mostCloseFriendsMii.mii.name}
                          </p>
                        </div>
                        <span className={pageStyles.pill}>
                          {summary.mostCloseFriendsMii.closeFriendCount} close friends
                        </span>
                      </div>
                      <div className={pageStyles.meta}>
                        <span className={pageStyles.tag}>
                          {summary.mostCloseFriendsMii.friendCount} total friends
                        </span>
                        <span className={pageStyles.tag}>
                          {summary.mostCloseFriendsMii.connections} connections
                        </span>
                      </div>
                    </div>
                  </Link>
                ) : null}

                {summary.romanceLeaderMii ? (
                  <Link
                    className={pageStyles.dashboardLinkCard}
                    to={getMiiProfilePath(summary.romanceLeaderMii.mii.id)}
                  >
                    <div className={pageStyles.dashboardInsightCard}>
                      <div className={pageStyles.itemRow}>
                        <div>
                          <h4>Biggest romance life</h4>
                          <p className={pageStyles.dashboardLeadName}>
                            {summary.romanceLeaderMii.mii.name}
                          </p>
                        </div>
                        <span className={pageStyles.pill}>
                          {summary.romanceLeaderMii.romanceCount} romance ties
                        </span>
                      </div>
                      <div className={pageStyles.meta}>
                        <span className={pageStyles.tag}>
                          {summary.romanceLeaderMii.crushCount} crushes
                        </span>
                        <span className={pageStyles.tag}>
                          {summary.romanceLeaderMii.positiveTies} positive ties
                        </span>
                      </div>
                    </div>
                  </Link>
                ) : null}

                {summary.highestLevelMii ? (
                  <Link
                    className={pageStyles.dashboardLinkCard}
                    to={getMiiProfilePath(summary.highestLevelMii.id)}
                  >
                    <div className={pageStyles.dashboardInsightCard}>
                      <div className={pageStyles.itemRow}>
                        <div>
                          <h4>Highest current level</h4>
                          <p className={pageStyles.dashboardLeadName}>
                            {summary.highestLevelMii.name}
                          </p>
                        </div>
                        <span className={pageStyles.pill}>
                          Level {summary.highestLevelMii.level}
                        </span>
                      </div>
                    </div>
                  </Link>
                ) : null}
              </div>
            </Card>

            <Card>
              <div className={pageStyles.sectionTitle}>
                <div>
                  <h3>Miis who need more friends</h3>
                  <p>Lowest-friendship Miis, ranked by friend count first.</p>
                  <p className={pageStyles.dashboardHelperNote}>
                    Friend totals include <strong>One-sided love (friend)</strong>, while close
                    friends only count exact <strong>Friends</strong> ties above the bottom two
                    friend stages.
                  </p>
                </div>
                <span className={pageStyles.pill}>
                  {summary.friendlessCount} with zero friends
                </span>
              </div>

              <div className={pageStyles.list}>
                {summary.miisNeedingFriends.map((entry, index) => (
                  <Link
                    key={entry.mii.id}
                    className={pageStyles.linkButton}
                    to={getMiiProfilePath(entry.mii.id)}
                  >
                    <div className={pageStyles.item}>
                      <div className={pageStyles.itemRow}>
                        <div>
                          <h4>
                            {index + 1}. {entry.mii.name}
                          </h4>
                          <p className={pageStyles.dashboardSubcopy}>
                            Level {entry.mii.level} and {entry.positiveTies} positive ties so far.
                          </p>
                        </div>
                        <span className={pageStyles.pill}>{entry.friendCount} friends</span>
                      </div>
                      <div className={pageStyles.meta}>
                        <span className={pageStyles.tag}>
                          {entry.closeFriendCount} close friends
                        </span>
                        <span className={pageStyles.tag}>{entry.connections} connections</span>
                        <span className={pageStyles.tag}>{entry.familyCount} family ties</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          <div className={pageStyles.splitGrid}>
            <Card>
              <div className={pageStyles.sectionTitle}>
                <div>
                  <h3>Personality mix</h3>
                  <p>See which personality group is steering the island's tone.</p>
                </div>
              </div>

              <div className={pageStyles.metricStack}>
                {summary.personalityGroupBreakdown.map((group) => (
                  <div key={group.group} className={pageStyles.metricRow}>
                    <div className={pageStyles.metricLabelRow}>
                      <div className={pageStyles.metricTitleWrap}>
                        <span
                          className={pageStyles.metricDot}
                          style={{ background: group.colorToken }}
                          aria-hidden="true"
                        />
                        <strong>{group.group}</strong>
                      </div>
                      <span className={pageStyles.metricValue}>
                        {group.count} ({Math.round(group.percentage * 100)}%)
                      </span>
                    </div>
                    <div className={pageStyles.metricTrack}>
                      <div
                        className={pageStyles.metricFill}
                        style={{
                          width: `${group.percentage * 100}%`,
                          background: group.colorToken,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className={pageStyles.sectionTitle}>
                <div>
                  <h3>Relationship climate</h3>
                  <p>How the island's directed feelings are distributed right now.</p>
                </div>
              </div>

              <div className={pageStyles.metricStack}>
                {summary.relationshipFamilyBreakdown.map((entry) => {
                  const share = summary.totalRelationships
                    ? (entry.count / summary.totalRelationships) * 100
                    : 0;

                  return (
                    <div key={entry.key} className={pageStyles.metricRow}>
                      <div className={pageStyles.metricLabelRow}>
                        <div className={pageStyles.metricTitleWrap}>
                          <span
                            className={pageStyles.metricDot}
                            style={{ background: entry.color }}
                            aria-hidden="true"
                          />
                          <strong>{entry.label}</strong>
                        </div>
                        <span className={pageStyles.metricValue}>{entry.count}</span>
                      </div>
                      <div className={pageStyles.metricTrack}>
                        <div
                          className={pageStyles.metricFill}
                          style={{ width: `${share}%`, background: entry.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className={pageStyles.splitGrid}>
            <Card>
              <div className={pageStyles.sectionTitle}>
                <div>
                  <h3>Cluster scene</h3>
                  <p>Mutual strong-tie cliques of 3 or more Miis.</p>
                </div>
              </div>
              <div className={pageStyles.dashboardInsightList}>
                <div className={pageStyles.dashboardInsightCard}>
                  <div className={pageStyles.itemRow}>
                    <div>
                      <h4>Detected clusters</h4>
                      <p className={pageStyles.dashboardLeadName}>{groups.length}</p>
                    </div>
                    <span className={pageStyles.pill}>{clusterlessCount} outside clusters</span>
                  </div>
                  {largestGroup ? (
                    <p className={pageStyles.dashboardSubcopy}>
                      Biggest group: {formatGroupMembers(largestGroup.members.map((member) => member.name))}
                    </p>
                  ) : (
                    <p className={pageStyles.dashboardSubcopy}>
                      No mutual 3-person cluster has formed yet.
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <div className={pageStyles.sectionTitle}>
                <div>
                  <h3>Quick links</h3>
                  <p>Jump straight into the views you'll use most.</p>
                </div>
              </div>
              <div className={pageStyles.list}>
                <Link className={pageStyles.linkButton} to="/miis">
                  <div className={pageStyles.item}>
                    <h4>Manage Miis</h4>
                    <p>Add, edit, search, and update profiles.</p>
                  </div>
                </Link>
                <Link className={pageStyles.linkButton} to="/graph/focus">
                  <div className={pageStyles.item}>
                    <h4>Inspect one Mii closely</h4>
                    <p>See their strongest ties and the people orbiting them.</p>
                  </div>
                </Link>
                <Link className={pageStyles.linkButton} to="/clusters">
                  <div className={pageStyles.item}>
                    <h4>Review friend groups</h4>
                    <p>Inspect mutual strong-tie clusters and hidden social pockets.</p>
                  </div>
                </Link>
              </div>
            </Card>
          </div>
        </>
      ) : null}
    </div>
  );
}
