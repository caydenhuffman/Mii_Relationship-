import dagre from "dagre";
import type { ReactNode } from "react";
import type { Edge, Node } from "@xyflow/react";
import { MarkerType } from "@xyflow/react";
import { RELATIONSHIP_TYPE_METADATA } from "@/config/relationshipMetadata";
import {
  getFocusedRelationshipIds,
  getRelationshipStageLabel,
  isPositiveSocialRelationshipType,
} from "@/lib/analytics";
import type { Mii, Relationship } from "@/types/domain";
import styles from "@/components/graphs/RelationshipFlow.module.css";

const DEFAULT_NODE_WIDTH = 220;
const DEFAULT_NODE_HEIGHT = 98;

type FlowNode = Node<{ label: ReactNode; polygonSides?: number }>;
type FlowEdgeData = {
  hoverLabel: string;
  relationshipTypes: string[];
  sourceStageKey: string;
  reciprocalStageKey?: string;
  sourceName: string;
  targetName: string;
};
type FlowEdge = Edge<FlowEdgeData>;

const RELATIONSHIP_VISUAL_PRIORITY = {
  oneSidedLove: 600,
  romance: 500,
  family: 400,
  friendship: 300,
  acquaintance: 200,
  ex: 100,
  stranger: 0,
} as const;

function createMiiNode(mii: Mii): FlowNode {
  return {
    id: mii.id,
    type: "miiNode",
    data: {
      label: (
        <div className={styles.nodeContent}>
          <strong>{mii.name}</strong>
          <span>{mii.personalityType}</span>
          <span>Level {mii.level}</span>
        </div>
      ),
    },
    position: { x: 0, y: 0 },
    style: {
      width: DEFAULT_NODE_WIDTH,
      minHeight: DEFAULT_NODE_HEIGHT,
      borderRadius: 18,
      border: "1px solid rgba(124, 93, 86, 0.12)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(255,250,244,0.99) 100%)",
      boxShadow: "0 10px 20px rgba(145, 114, 92, 0.08)",
      padding: "12px",
    },
  };
}

function createFocusedRelationshipNode(
  mii: Mii,
  selectedMii: Mii,
  relationshipByPairKey: Map<string, Relationship>,
): FlowNode {
  const outgoingRelationship = relationshipByPairKey.get(
    `${mii.id}|${selectedMii.id}`,
  );
  const incomingRelationship = relationshipByPairKey.get(
    `${selectedMii.id}|${mii.id}`,
  );

  if (!outgoingRelationship && !incomingRelationship) {
    return createMiiNode(mii);
  }

  return {
    id: mii.id,
    type: "miiNode",
    data: {
      label: (
        <div className={styles.nodeContent}>
          <strong>{mii.name}</strong>
          {outgoingRelationship ? (
            <>
              <span>{`${mii.name} -> ${selectedMii.name}`}</span>
              <span>
                {outgoingRelationship.relationshipType}:{" "}
                {getRelationshipStageLabel(outgoingRelationship.stageKey)}
              </span>
            </>
          ) : null}
          {incomingRelationship ? (
            <>
              <span>{`${mii.name} <- ${selectedMii.name}`}</span>
              <span>
                {incomingRelationship.relationshipType}:{" "}
                {getRelationshipStageLabel(incomingRelationship.stageKey)}
              </span>
            </>
          ) : null}
        </div>
      ),
    },
    position: { x: 0, y: 0 },
    style: {
      width: 280,
      minHeight: 152,
      borderRadius: 18,
      border: "1px solid rgba(124, 93, 86, 0.12)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(255,250,244,0.99) 100%)",
      boxShadow: "0 10px 20px rgba(145, 114, 92, 0.08)",
      padding: "12px",
    },
  };
}

function buildPairKey(relationship: Relationship) {
  if (relationship.pairId) {
    return `pair:${relationship.pairId}`;
  }

  return `pair:${[relationship.sourceMiiId, relationship.targetMiiId].sort().join("|")}`;
}

function getDominantRelationshipMetadata(
  relationship: Relationship,
  reciprocalRelationship?: Relationship,
) {
  const candidates = [
    RELATIONSHIP_TYPE_METADATA[relationship.relationshipType],
    reciprocalRelationship
      ? RELATIONSHIP_TYPE_METADATA[reciprocalRelationship.relationshipType]
      : undefined,
  ].filter(
    (
      candidate,
    ): candidate is (typeof RELATIONSHIP_TYPE_METADATA)[keyof typeof RELATIONSHIP_TYPE_METADATA] =>
      Boolean(candidate),
  );

  return candidates.sort(
    (left, right) =>
      RELATIONSHIP_VISUAL_PRIORITY[right.family] -
      RELATIONSHIP_VISUAL_PRIORITY[left.family],
  )[0];
}

function createRelationshipEdge(
  relationship: Relationship,
  reciprocalRelationship: Relationship | undefined,
  miiMap: Map<string, Mii>,
): FlowEdge {
  const metadata =
    getDominantRelationshipMetadata(relationship, reciprocalRelationship) ??
    RELATIONSHIP_TYPE_METADATA[relationship.relationshipType];
  const sourceName = miiMap.get(relationship.sourceMiiId)?.name ?? relationship.sourceMiiId;
  const targetName = miiMap.get(relationship.targetMiiId)?.name ?? relationship.targetMiiId;
  const hoverLabel = `${sourceName} -> ${targetName}: ${relationship.relationshipType} (${getRelationshipStageLabel(relationship.stageKey)})${
    reciprocalRelationship
      ? ` | ${
          miiMap.get(reciprocalRelationship.sourceMiiId)?.name ??
          reciprocalRelationship.sourceMiiId
        } -> ${
          miiMap.get(reciprocalRelationship.targetMiiId)?.name ??
          reciprocalRelationship.targetMiiId
        }: ${reciprocalRelationship.relationshipType} (${getRelationshipStageLabel(
          reciprocalRelationship.stageKey,
        )})`
      : ""
  }`;

  return {
    id: buildPairKey(relationship),
    source: relationship.sourceMiiId,
    sourceHandle: "right",
    target: relationship.targetMiiId,
    targetHandle: "left",
    markerStart: reciprocalRelationship
      ? undefined
      : {
          type: MarkerType.ArrowClosed,
          color: metadata.color,
        },
    markerEnd: reciprocalRelationship
      ? undefined
      : {
          type: MarkerType.ArrowClosed,
          color: metadata.color,
        },
    labelStyle: {
      fill: "var(--text-secondary)",
      fontSize: 10,
      fontWeight: 700,
    },
    labelBgStyle: {
      fill: "rgba(255, 255, 255, 0.92)",
      fillOpacity: 1,
    },
    style: {
      stroke: metadata.color,
      strokeWidth: reciprocalRelationship ? 2.8 : 2.1,
    },
    data: {
      hoverLabel,
      relationshipTypes: reciprocalRelationship
        ? [relationship.relationshipType, reciprocalRelationship.relationshipType]
        : [relationship.relationshipType],
      sourceStageKey: relationship.stageKey,
      reciprocalStageKey: reciprocalRelationship?.stageKey,
      sourceName,
      targetName,
    },
    type: "default",
  };
}

function collapseRelationshipPairs(miis: Mii[], relationships: Relationship[]) {
  const consumed = new Set<string>();
  const edges: FlowEdge[] = [];
  const miiMap = new Map(miis.map((mii) => [mii.id, mii]));
  const reciprocalByRelationshipId = new Map<string, Relationship>();
  const relationshipByPairKey = new Map<string, Relationship>();

  for (const relationship of relationships) {
    relationshipByPairKey.set(
      `${relationship.sourceMiiId}|${relationship.targetMiiId}`,
      relationship,
    );
  }

  for (const relationship of relationships) {
    const reciprocal = relationshipByPairKey.get(
      `${relationship.targetMiiId}|${relationship.sourceMiiId}`,
    );
    if (reciprocal) {
      reciprocalByRelationshipId.set(relationship.id, reciprocal);
    }
  }

  for (const relationship of relationships) {
    if (consumed.has(relationship.id)) {
      continue;
    }

    const reciprocalRelationship = reciprocalByRelationshipId.get(relationship.id);
    edges.push(createRelationshipEdge(relationship, reciprocalRelationship, miiMap));
    consumed.add(relationship.id);

    if (reciprocalRelationship) {
      consumed.add(reciprocalRelationship.id);
    }
  }

  return edges;
}

function layoutElements(
  nodes: FlowNode[],
  edges: FlowEdge[],
  graphOptions?: Record<string, unknown>,
) {
  const graph = new dagre.graphlib.Graph({ multigraph: true });
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph(
    graphOptions ?? {
      rankdir: "LR",
      ranksep: 180,
      nodesep: 160,
      edgesep: 56,
      marginx: 40,
      marginy: 40,
    },
  );

  nodes.forEach((node) => {
    const width =
      typeof node.style?.width === "number" ? node.style.width : DEFAULT_NODE_WIDTH;
    const height =
      typeof node.style?.minHeight === "number" ? node.style.minHeight : DEFAULT_NODE_HEIGHT;

    graph.setNode(node.id, {
      width,
      height,
    });
  });

  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target, {}, edge.id);
  });

  dagre.layout(graph);

  return {
    nodes: nodes.map((node) => {
      const position = graph.node(node.id);
      const width =
        typeof node.style?.width === "number" ? node.style.width : DEFAULT_NODE_WIDTH;
      const height =
        typeof node.style?.minHeight === "number" ? node.style.minHeight : DEFAULT_NODE_HEIGHT;

      return {
        ...node,
        position: {
          x: position.x - width / 2,
          y: position.y - height / 2,
        },
      };
    }),
    edges,
  };
}

function createClusterNode(mii: Mii, polygonSides: number): FlowNode {
  return {
    id: mii.id,
    type: "clusterNode",
    data: {
      label: mii.name,
      polygonSides,
    },
    position: { x: 0, y: 0 },
    style: {
      width: 80,
      height: 80,
      borderRadius: "50%",
      border: "2px solid rgba(124, 93, 86, 0.16)",
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(255,250,244,0.99) 100%)",
      boxShadow: "0 8px 18px rgba(145, 114, 92, 0.1)",
      padding: "6px",
    },
  };
}

function getHandleSide(from: { x: number; y: number }, to: { x: number; y: number }): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx > absDy) {
    return dx > 0 ? "right" : "left";
  }

  return dy > 0 ? "bottom" : "top";
}

function createClusterEdge(
  relationship: Relationship,
  sourceHandle: string,
  targetHandle: string,
): FlowEdge {
  const metadata = RELATIONSHIP_TYPE_METADATA[relationship.relationshipType];
  const isCrush = metadata.family === "oneSidedLove";

  return {
    id: relationship.id,
    source: relationship.sourceMiiId,
    sourceHandle,
    target: relationship.targetMiiId,
    targetHandle,
    markerEnd: isCrush
      ? {
          type: MarkerType.ArrowClosed,
          color: metadata.color,
        }
      : undefined,
    label: metadata.shortLabel,
    labelStyle: {
      fill: "var(--text-secondary)",
      fontSize: 10,
      fontWeight: 700,
    },
    labelBgStyle: {
      fill: "rgba(255, 255, 255, 0.96)",
      fillOpacity: 1,
    },
    style: {
      stroke: metadata.color,
      strokeWidth: isCrush ? 3.2 : 2,
      strokeDasharray: isCrush ? "4 2" : "0",
    },
    data: {
      hoverLabel: metadata.shortLabel,
    },
    type: "default",
  };
}

export function buildFullRelationshipGraph(miis: Mii[], relationships: Relationship[]) {
  return layoutElements(
    miis.map((mii) => createMiiNode(mii)),
    collapseRelationshipPairs(miis, relationships),
  );
}

export function buildClusterOverviewGraph(members: Mii[], relationships: Relationship[]) {
  const n = members.length;
  const radius = 280;
  const centerX = 400;
  const centerY = 250;

  const nodes = members.map((mii, index) => {
    const angle = (2 * Math.PI * index) / n - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    return {
      ...createClusterNode(mii, n),
      position: { x, y },
    };
  });

  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const edges = relationships.map((relationship) => {
    const sourceNode = nodeById.get(relationship.sourceMiiId);
    const targetNode = nodeById.get(relationship.targetMiiId);

    const sourceHandle =
      sourceNode && targetNode
        ? `${getHandleSide(sourceNode.position, targetNode.position)}-source`
        : "right-source";
    const targetHandle =
      sourceNode && targetNode
        ? `${getHandleSide(targetNode.position, sourceNode.position)}-target`
        : "left-target";

    return createClusterEdge(relationship, sourceHandle, targetHandle);
  });

  return { nodes, edges };
}

export function buildFocusedRelationshipGraph(
  selectedMiiId: string,
  miis: Mii[],
  relationships: Relationship[],
) {
  const includedMiiIds = getFocusedRelationshipIds(selectedMiiId, relationships);
  const selectedMii = miis.find((mii) => mii.id === selectedMiiId);

  const filteredRelationships = relationships.filter(
    (relationship) =>
      includedMiiIds.has(relationship.sourceMiiId) &&
      includedMiiIds.has(relationship.targetMiiId) &&
      isPositiveSocialRelationshipType(relationship.relationshipType),
  );

  const filteredMiis = miis.filter((mii) => includedMiiIds.has(mii.id));
  const relationshipByPairKey = new Map<string, Relationship>();

  for (const relationship of filteredRelationships) {
    relationshipByPairKey.set(
      `${relationship.sourceMiiId}|${relationship.targetMiiId}`,
      relationship,
    );
  }

  return layoutElements(
    filteredMiis.map((mii) =>
      selectedMii && mii.id !== selectedMii.id
        ? createFocusedRelationshipNode(mii, selectedMii, relationshipByPairKey)
        : createMiiNode(mii),
    ),
    collapseRelationshipPairs(filteredMiis, filteredRelationships),
  );
}
