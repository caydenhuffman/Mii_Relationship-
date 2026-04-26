import { useMemo } from "react";
import { ReactFlow } from "@xyflow/react";
import type { Mii, Relationship } from "@/types/domain";
import { buildClusterOverviewGraph } from "@/lib/graph";
import ClusterNode from "./ClusterNode";
import styles from "./ClusterOverviewGraph.module.css";

interface ClusterOverviewGraphProps {
  members: Mii[];
  relationships: Relationship[];
}

export function ClusterOverviewGraph({ members, relationships }: ClusterOverviewGraphProps) {
  const graph = useMemo(
    () => buildClusterOverviewGraph(members, relationships),
    [members, relationships],
  );

  const nodes = useMemo(
    () =>
      graph.nodes.map((node) => ({
        ...node,
        style: {
          ...node.style,
          width: 100,
          minHeight: 100,
        },
      })),
    [graph.nodes],
  );

  const edges = useMemo(
    () =>
      graph.edges.map((edge) => ({
        ...edge,
        labelStyle: {
          ...edge.labelStyle,
          fill: "var(--text-secondary)",
          fontSize: 10,
          fontWeight: 700,
        },
        labelBgStyle: {
          ...edge.labelBgStyle,
          fill: "rgba(255, 255, 255, 0.94)",
          fillOpacity: 1,
        },
      })),
    [graph.edges],
  );

  return (
    <div className={styles.clusterGraphWrapper}>
      <ReactFlow
        className={styles.clusterGraphFlow}
        fitView
        nodes={nodes}
        edges={edges}
        nodeTypes={{ clusterNode: ClusterNode }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        onlyRenderVisibleElements
        minZoom={0.45}
        maxZoom={1.2}
        fitViewOptions={{ padding: 0.18 }}
        proOptions={{ hideAttribution: true }}
      />
    </div>
  );
}
