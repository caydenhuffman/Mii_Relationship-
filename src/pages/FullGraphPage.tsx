import { useMemo } from "react";
import { RelationshipFlow } from "@/components/graphs/RelationshipFlow";
import { buildFullRelationshipGraph } from "@/lib/graph";
import { useIsland } from "@/hooks/useIsland";
import pageStyles from "./Page.module.css";

export function FullGraphPage() {
  const { islandData, status } = useIsland();
  const graph = useMemo(
    () => buildFullRelationshipGraph(islandData.miis, islandData.relationships),
    [islandData.miis, islandData.relationships],
  );

  if (status === "loading") {
    return <p>Loading island data...</p>;
  }

  return (
    <div className={pageStyles.stack}>
      <div className={pageStyles.pageHeader}>
        <div>
          <h2>Full relationship graph</h2>
          <p>
            Every Mii appears as a node, and mutual pairs are shown as single, cleaner
            connections instead of doubled arrows.
          </p>
        </div>
      </div>

      <RelationshipFlow
        title="Island-wide relationship graph"
        description="Click any Mii to spotlight their network and reveal both sides of each relationship without cluttering the whole map."
        nodes={graph.nodes}
        edges={graph.edges}
        emptyTitle="No graph yet"
        emptyDescription="Add at least one Mii to start building the graph."
      />
    </div>
  );
}
