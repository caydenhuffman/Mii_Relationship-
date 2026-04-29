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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const activeNodeId = selectedNodeId;

  const connectedEdgeIds = useMemo(
    () =>
      new Set(
        edges
          .filter(
            (edge) =>
              activeNodeId &&
              (edge.source === activeNodeId || edge.target === activeNodeId),
          )
          .map((edge) => edge.id),
      ),
    [activeNodeId, edges],
  );

  const connectedNodeIds = useMemo(() => {
    if (!activeNodeId) {
      return new Set<string>();
    }

    const nextNodeIds = new Set<string>([activeNodeId]);

    for (const edge of edges) {
      if (edge.source === activeNodeId) {
        nextNodeIds.add(edge.target);
      }

      if (edge.target === activeNodeId) {
        nextNodeIds.add(edge.source);
      }
    }

    return nextNodeIds;
  }, [activeNodeId, edges]);

  const displayNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        style: {
          ...node.style,
          opacity: activeNodeId
            ? connectedNodeIds.has(node.id)
              ? 1
              : 0.24
            : 1,
          boxShadow:
            activeNodeId && node.id === activeNodeId
              ? "0 0 0 4px rgba(109, 200, 200, 0.2), 0 16px 30px rgba(109, 133, 168, 0.16)"
              : node.style?.boxShadow,
        },
      })),
    [activeNodeId, connectedNodeIds, nodes],
  );

  const displayEdges = useMemo(
    () =>
      edges.map((edge) => {
        const isConnected = connectedEdgeIds.has(edge.id);

        return {
          ...edge,
          label:
            activeNodeId && isConnected
              ? ((edge.data as { hoverLabel?: string } | undefined)?.hoverLabel ?? edge.label)
              : undefined,
          style: {
            ...edge.style,
            opacity: activeNodeId ? (isConnected ? 1 : 0.1) : 0.7,
            strokeWidth: activeNodeId ? (isConnected ? 3.8 : 1.4) : edge.style?.strokeWidth,
          },
        };
      }),
    [activeNodeId, connectedEdgeIds, edges],
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

      <div className={styles.graphHint}>
        {activeNodeId
          ? "Click the same node again, or click empty space, to clear the spotlight."
          : "Click any Mii node to spotlight their connections and reveal relationship details."}
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
          selectionOnDrag={false}
          zoomOnDoubleClick={false}
          minZoom={0.45}
          maxZoom={1.4}
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          onNodeClick={(_, node) => {
            setSelectedNodeId((currentValue) =>
              currentValue === node.id ? null : node.id,
            );
          }}
          onPaneClick={() => {
            setSelectedNodeId(null);
          }}
        >
          <Background gap={18} color="rgba(121, 93, 103, 0.08)" />
          <Controls />
        </ReactFlow>
      </div>
    </Card>
  );
}
