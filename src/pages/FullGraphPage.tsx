import { useMemo } from "react";
import { RelationshipFlow } from "@/components/graphs/RelationshipFlow";
import { buildFullRelationshipGraph } from "@/lib/graph";
import { useIsland } from "@/hooks/useIsland";
import pageStyles from "./Page.module.css";

export function FullGraphPage() {
  const { islandData, status } = useIsland();

  if (status === "loading") {
    return <p>Loading island data...</p>;
  }

  const graph = useMemo(
    () => buildFullRelationshipGraph(islandData.miis, islandData.relationships),
    [islandData.miis, islandData.relationships],
  );

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
        description="Hover any Mii to highlight their connections and reveal both sides of each relationship."
        nodes={graph.nodes}
        edges={graph.edges}
        emptyTitle="No graph yet"
        emptyDescription="Add at least one Mii to start building the graph."
      />
    </div>
  );
}
