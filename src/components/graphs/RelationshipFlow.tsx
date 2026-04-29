import { useMemo, useState } from "react";
import { Background, Controls, ReactFlow } from "@xyflow/react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { RELATIONSHIP_LEGEND_ITEMS } from "@/config/relationshipMetadata";
import { getRelationshipStageLabel } from "@/lib/analytics";
import type { Edge, Node } from "@xyflow/react";
import MiiNode from "./MiiNode";
import styles from "./RelationshipFlow.module.css";

const NODE_TYPES = { miiNode: MiiNode };

const GROUPED_RELATIONSHIP_TYPES: Record<string, string[]> = {
  Family: ["Family", "Relatives"],
  Relatives: ["Family", "Relatives"],
  Crushes: ["One-sided love (friend)", "One-sided love (acquaintance)"],
};

function getRelatedTypes(label: string): string[] {
  return GROUPED_RELATIONSHIP_TYPES[label] ?? [label];
}

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
  const [disabledRelationshipTypes, setDisabledRelationshipTypes] = useState<Set<string>>(
    new Set(),
  );
  const activeNodeId = selectedNodeId;

  const isEdgeVisible = (edge: Edge) => {
    const relationshipTypes = (edge.data as { relationshipTypes?: string[] } | undefined)
      ?.relationshipTypes ?? [];
    return !relationshipTypes.some((type) => disabledRelationshipTypes.has(type));
  };

  const visibleEdges = useMemo(
    () => edges.filter(isEdgeVisible),
    [edges, disabledRelationshipTypes],
  );

  const connectedEdgeIds = useMemo(
    () =>
      new Set(
        visibleEdges
          .filter(
            (edge) =>
              activeNodeId &&
              (edge.source === activeNodeId || edge.target === activeNodeId),
          )
          .map((edge) => edge.id),
      ),
    [activeNodeId, visibleEdges],
  );

  const connectedNodeIds = useMemo(() => {
    if (!activeNodeId) {
      return new Set<string>();
    }

    const nextNodeIds = new Set<string>([activeNodeId]);

    for (const edge of visibleEdges) {
      if (edge.source === activeNodeId) {
        nextNodeIds.add(edge.target);
      }

      if (edge.target === activeNodeId) {
        nextNodeIds.add(edge.source);
      }
    }

    return nextNodeIds;
  }, [activeNodeId, visibleEdges]);

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
      visibleEdges.map((edge) => {
        const isConnected = connectedEdgeIds.has(edge.id);
        
        let label: string | undefined;
        if (activeNodeId && isConnected) {
          const edgeData = edge.data as {
            sourceStageKey?: string;
            reciprocalStageKey?: string;
            sourceName?: string;
            targetName?: string;
          } | undefined;
          
          if (edgeData?.sourceStageKey) {
            const sourceStage = getRelationshipStageLabel(edgeData.sourceStageKey);
            const reciprocalStage = edgeData.reciprocalStageKey
              ? getRelationshipStageLabel(edgeData.reciprocalStageKey)
              : undefined;
            
            // Determine the other person's name (the one we're NOT clicking on)
            const otherPersonName = activeNodeId === edge.source ? edgeData.targetName : edgeData.sourceName;
            
            if (activeNodeId === edge.source) {
              // Active node is the source - show how we feel, then how they feel
              label = `${sourceStage}`;
              if (reciprocalStage) {
                label += ` | (${otherPersonName}): ${reciprocalStage}`;
              }
            } else {
              // Active node is the target - show how they feel toward us, then how we feel back
              label = `${sourceStage}`;
              if (reciprocalStage) {
                label += ` | (${otherPersonName}): ${reciprocalStage}`;
              }
            }
          }
        }

        return {
          ...edge,
          label,
          style: {
            ...edge.style,
            opacity: activeNodeId ? (isConnected ? 1 : 0.1) : 0.7,
            strokeWidth: activeNodeId ? (isConnected ? 3.8 : 1.4) : edge.style?.strokeWidth,
          },
        };
      }),
    [activeNodeId, connectedEdgeIds, visibleEdges],
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
          {RELATIONSHIP_LEGEND_ITEMS.map((item) => {
            const relatedTypes = getRelatedTypes(item.label);
            const isDisabled = relatedTypes.every((type) => disabledRelationshipTypes.has(type));
            return (
              <button
                key={item.label}
                className={`${styles.legendItem} ${isDisabled ? styles.legendItemDisabled : ""}`}
                onClick={() => {
                  setDisabledRelationshipTypes((prev) => {
                    const next = new Set(prev);
                    const allDisabled = relatedTypes.every((type) => next.has(type));
                    
                    relatedTypes.forEach((type) => {
                      if (allDisabled) {
                        next.delete(type);
                      } else {
                        next.add(type);
                      }
                    });
                    return next;
                  });
                }}
                title={isDisabled ? "Click to show" : "Click to hide"}
              >
                <span
                  className={styles.legendSwatch}
                  style={{
                    background: item.color,
                    opacity: isDisabled ? 0.3 : 1,
                  }}
                  aria-hidden="true"
                />
                {item.label}
              </button>
            );
          })}
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
          minZoom={0.1}
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
