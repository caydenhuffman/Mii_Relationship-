import { useMemo, useState } from "react";
import { Background, Controls, ReactFlow } from "@xyflow/react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { RELATIONSHIP_LEGEND_ITEMS } from "@/config/relationshipMetadata";
import type { Edge, Node } from "@xyflow/react";
import MiiNode from "./MiiNode";
import styles from "./RelationshipFlow.module.css";

const NODE_TYPES = { miiNode: MiiNode };

interface RelationshipFlowProps {
  title: string;
  description: string;
  nodes: Node[];
  edges: Edge[];
  emptyTitle: string;
  emptyDescription: string;
}

export function RelationshipFlow({
  title,
  description,
  nodes,
  edges,
  emptyTitle,
  emptyDescription,
}: RelationshipFlowProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  const connectedEdgeIds = useMemo(
    () =>
      new Set(
        edges
          .filter(
            (edge) =>
              hoveredNodeId &&
              (edge.source === hoveredNodeId || edge.target === hoveredNodeId),
          )
          .map((edge) => edge.id),
      ),
    [edges, hoveredNodeId],
  );

  const connectedNodeIds = useMemo(() => {
    if (!hoveredNodeId) {
      return new Set<string>();
    }

    const nextNodeIds = new Set<string>([hoveredNodeId]);

    for (const edge of edges) {
      if (edge.source === hoveredNodeId) {
        nextNodeIds.add(edge.target);
      }

      if (edge.target === hoveredNodeId) {
        nextNodeIds.add(edge.source);
      }
    }

    return nextNodeIds;
  }, [edges, hoveredNodeId]);

  const displayNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        style: {
          ...node.style,
          opacity: hoveredNodeId
            ? connectedNodeIds.has(node.id)
              ? 1
              : 0.28
            : 1,
          boxShadow:
            hoveredNodeId && node.id === hoveredNodeId
              ? "0 0 0 4px rgba(239, 134, 176, 0.28), 0 14px 28px rgba(87, 61, 72, 0.12)"
              : node.style?.boxShadow,
        },
      })),
    [connectedNodeIds, hoveredNodeId, nodes],
  );

  const displayEdges = useMemo(
    () =>
      edges.map((edge) => {
        const isConnected = connectedEdgeIds.has(edge.id);

        return {
          ...edge,
          label:
            hoveredNodeId && isConnected
              ? ((edge.data as { hoverLabel?: string } | undefined)?.hoverLabel ?? edge.label)
              : undefined,
          style: {
            ...edge.style,
            opacity: hoveredNodeId ? (isConnected ? 1 : 0.12) : 0.72,
            strokeWidth: hoveredNodeId ? (isConnected ? 3.8 : 1.4) : edge.style?.strokeWidth,
          },
        };
      }),
    [connectedEdgeIds, edges, hoveredNodeId],
  );

  if (nodes.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <Card className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className={styles.legend}>
          {RELATIONSHIP_LEGEND_ITEMS.map((item) => (
            <span key={item.label} className={styles.legendItem}>
              <span
                className={styles.legendSwatch}
                style={{ background: item.color }}
                aria-hidden="true"
              />
              {item.label}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.canvas}>
        <ReactFlow
          fitView
          nodes={displayNodes}
          edges={displayEdges}
          nodeTypes={NODE_TYPES}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          nodesFocusable={false}
          edgesFocusable={false}
          onlyRenderVisibleElements
          minZoom={0.45}
          maxZoom={1.4}
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          onNodeMouseEnter={(_, node) => setHoveredNodeId(node.id)}
          onNodeMouseLeave={() => setHoveredNodeId(null)}
          onPaneMouseLeave={() => setHoveredNodeId(null)}
        >
          <Background gap={18} color="rgba(121, 93, 103, 0.08)" />
          <Controls />
        </ReactFlow>
      </div>
    </Card>
  );
}
