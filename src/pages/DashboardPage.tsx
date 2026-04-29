import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { RELATIONSHIP_TYPES } from "@/config/relationshipMetadata";
import { findFriendGroups, buildDashboardSummary } from "@/lib/analytics";
import { useIsland } from "@/hooks/useIsland";
import pageStyles from "./Page.module.css";

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

  if (status === "loading") {
    return <p>Loading island data...</p>;
  }

  return (
    <div className={pageStyles.stack}>
      <div className={pageStyles.pageHeader}>
        <div>
          <h2>Island dashboard</h2>
          <p>
            Get a quick read on your island’s population, directed relationships, and
            emerging friend circles.
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

      <section className={pageStyles.cardGrid}>
        <StatCard label="Total Miis" value={summary.totalMiis} accent="var(--accent-lagoon)" />
        <StatCard
          label="Directed relationships"
          value={summary.totalRelationships}
          accent="var(--accent-coral)"
        />
        <StatCard
          label="Positive social ties"
          value={summary.positiveSocialCount}
          accent="var(--accent-leaf)"
        />
        <StatCard
          label="Detected clusters"
          value={groups.length}
          accent="var(--accent-teal)"
          helper="Mutual positive ties only"
        />
      </section>

      <div className={pageStyles.splitGrid}>
        <Card>
          <div className={pageStyles.sectionTitle}>
            <div>
              <h3>Relationship counts</h3>
              <p>Directed counts by relationship type.</p>
            </div>
          </div>
          <div className={pageStyles.list}>
            {RELATIONSHIP_TYPES.map((relationshipType) => (
              <div key={relationshipType} className={pageStyles.item}>
                <div className={pageStyles.itemRow}>
                  <div>
                    <h4>{relationshipType}</h4>
                  </div>
                  <span className={pageStyles.pill}>
                    {summary.countByType[relationshipType]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className={pageStyles.sectionTitle}>
            <div>
              <h3>Quick links</h3>
              <p>Jump straight into the views you’ll use most.</p>
            </div>
          </div>
          <div className={pageStyles.list}>
            <Link className={pageStyles.linkButton} to="/miis">
              <div className={pageStyles.item}>
                <h4>Manage Miis</h4>
                <p>Add, edit, search, and delete profiles.</p>
              </div>
            </Link>
            <Link className={pageStyles.linkButton} to="/graph">
              <div className={pageStyles.item}>
                <h4>Open full graph</h4>
                <p>See the whole island as a directed relationship network.</p>
              </div>
            </Link>
            <Link className={pageStyles.linkButton} to="/clusters">
              <div className={pageStyles.item}>
                <h4>Review clusters</h4>
                <p>Inspect mutual-friend groups built from positive social ties.</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
