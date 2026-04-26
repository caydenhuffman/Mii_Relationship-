import { useEffect, useMemo, useState } from "react";
import { RelationshipFlow } from "@/components/graphs/RelationshipFlow";
import { buildFocusedRelationshipGraph } from "@/lib/graph";
import { useIsland } from "@/hooks/useIsland";
import pageStyles from "./Page.module.css";

export function FocusedGraphPage() {
  const { islandData, status } = useIsland();
  const [selectedMiiId, setSelectedMiiId] = useState("");

  useEffect(() => {
    if (!selectedMiiId && islandData.miis.length > 0) {
      setSelectedMiiId(islandData.miis[0].id);
    }
  }, [islandData.miis, selectedMiiId]);

  if (status === "loading") {
    return <p>Loading island data...</p>;
  }

  const graph = useMemo(
    () =>
      selectedMiiId
        ? buildFocusedRelationshipGraph(
            selectedMiiId,
            islandData.miis,
            islandData.relationships,
          )
        : { nodes: [], edges: [] },
    [islandData.miis, islandData.relationships, selectedMiiId],
  );

  return (
    <div className={pageStyles.stack}>
      <div className={pageStyles.pageHeader}>
        <div>
          <h2>Mii-centered graph</h2>
          <p>
            Focus on one Mii and see how everyone around them connects back to that person.
          </p>
        </div>
      </div>

      <label>
        Select a Mii
        <select value={selectedMiiId} onChange={(event) => setSelectedMiiId(event.target.value)}>
          {islandData.miis.map((mii) => (
            <option key={mii.id} value={mii.id}>
              {mii.name}
            </option>
          ))}
        </select>
      </label>

      <div className={pageStyles.note}>
        This view includes strong ties only: Friends, Family, Relatives, Sweethearts,
        Spouses, and One-sided love (friend).
      </div>

      <RelationshipFlow
        title="Focused relationship graph"
        description="Hover a Mii to spotlight their connections. Each surrounding node summarizes how that Mii and the selected Mii feel about each other."
        nodes={graph.nodes}
        edges={graph.edges}
        emptyTitle="Pick a Mii to focus on"
        emptyDescription="Once at least one Mii exists, select them here to inspect their meaningful network."
      />
    </div>
  );
}
