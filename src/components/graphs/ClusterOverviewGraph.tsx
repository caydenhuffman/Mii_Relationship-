import { useMemo } from "react";
import type { Mii, Relationship } from "@/types/domain";
import { RELATIONSHIP_TYPE_METADATA } from "@/config/relationshipMetadata";
import styles from "./ClusterOverviewGraph.module.css";

const VIEWBOX_WIDTH = 760;
const VIEWBOX_HEIGHT = 520;
const CENTER_X = VIEWBOX_WIDTH / 2;
const CENTER_Y = VIEWBOX_HEIGHT / 2;

function getNodeRadius(memberCount: number) {
  if (memberCount <= 3) {
    return 44;
  }

  if (memberCount <= 5) {
    return 40;
  }

  if (memberCount <= 7) {
    return 36;
  }

  return 32;
}

function getOrbitRadius(memberCount: number, nodeRadius: number) {
  const maxRadius = Math.min(CENTER_X, CENTER_Y) - nodeRadius - 34;
  const preferredRadius = 120 + memberCount * 18;
  return Math.min(maxRadius, preferredRadius);
}

interface ClusterOverviewGraphProps {
  members: Mii[];
  relationships: Relationship[];
}

export function ClusterOverviewGraph({ members, relationships }: ClusterOverviewGraphProps) {
  const nodeRadius = useMemo(() => getNodeRadius(members.length), [members.length]);
  const orbitRadius = useMemo(
    () => getOrbitRadius(members.length, nodeRadius),
    [members.length, nodeRadius],
  );

  const nodePositions = useMemo(() => {
    if (members.length === 1) {
      return new Map([[members[0].id, { x: CENTER_X, y: CENTER_Y }]]);
    }

    return new Map(
      members.map((member, index) => {
        const angle = (2 * Math.PI * index) / members.length - Math.PI / 2;
        return [
          member.id,
          {
            x: CENTER_X + orbitRadius * Math.cos(angle),
            y: CENTER_Y + orbitRadius * Math.sin(angle),
          },
        ];
      }),
    );
  }, [members, orbitRadius]);

  const renderedEdges = useMemo(() => {
    const pairToRelationships = new Map<string, Relationship[]>();

    for (const relationship of relationships) {
      const pairKey = [relationship.sourceMiiId, relationship.targetMiiId].sort().join("|");
      const pairRelationships = pairToRelationships.get(pairKey) ?? [];
      pairRelationships.push(relationship);
      pairToRelationships.set(pairKey, pairRelationships);
    }

    return [...pairToRelationships.entries()]
      .map(([pairKey, pairRelationships]) => {
        const [leftId, rightId] = pairKey.split("|");
        const leftPosition = nodePositions.get(leftId);
        const rightPosition = nodePositions.get(rightId);

        if (!leftPosition || !rightPosition) {
          return null;
        }

        const crushRelationship = pairRelationships.find((relationship) => {
          const metadata = RELATIONSHIP_TYPE_METADATA[relationship.relationshipType];
          return metadata.family === "oneSidedLove";
        });
        const displayRelationship = crushRelationship ?? pairRelationships[0];
        const displayMetadata = RELATIONSHIP_TYPE_METADATA[displayRelationship.relationshipType];
        const lineStartId = leftId;
        const lineEndId = rightId;
        const startCenter = nodePositions.get(lineStartId);
        const endCenter = nodePositions.get(lineEndId);

        if (!startCenter || !endCenter) {
          return null;
        }

        const dx = endCenter.x - startCenter.x;
        const dy = endCenter.y - startCenter.y;
        const length = Math.hypot(dx, dy) || 1;
        const unitX = dx / length;
        const unitY = dy / length;

        const start = {
          x: startCenter.x + unitX * nodeRadius,
          y: startCenter.y + unitY * nodeRadius,
        };
        const end = {
          x: endCenter.x - unitX * nodeRadius,
          y: endCenter.y - unitY * nodeRadius,
        };

        const hasArrow = Boolean(crushRelationship);
        const arrowTargetId = crushRelationship?.targetMiiId;
        const arrowFromStartToEnd = arrowTargetId ? arrowTargetId === lineEndId : false;

        return {
          id: pairKey,
          color: displayMetadata.color,
          hasArrow,
          arrowFromStartToEnd,
          path: `M ${start.x} ${start.y} L ${end.x} ${end.y}`,
        };
      })
      .filter((edge): edge is NonNullable<typeof edge> => Boolean(edge));
  }, [nodePositions, nodeRadius, relationships]);

  return (
    <div className={styles.clusterGraphWrapper}>
      <svg
        className={styles.clusterGraphSvg}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        role="img"
        aria-label="Cluster relationship graph"
      >
        <defs>
          {renderedEdges.map((edge) => (
            <marker
              key={`marker-${edge.id}`}
              id={`cluster-arrow-${edge.id}`}
              viewBox="0 0 20 20"
              refX="17"
              refY="10"
              markerWidth={edge.hasArrow ? 26 : 12}
              markerHeight={edge.hasArrow ? 26 : 12}
              markerUnits="userSpaceOnUse"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 20 10 L 0 20 z" fill={edge.color} />
            </marker>
          ))}
        </defs>

        <g className={styles.edgeLayer}>
          {renderedEdges.map((edge) => (
            <g key={edge.id}>
              <path d={edge.path} className={styles.edgeHalo} />
              <path
                d={edge.path}
                fill="none"
                stroke={edge.color}
                strokeWidth={edge.hasArrow ? 8.5 : 8.5}
                strokeLinecap="round"
                markerStart={
                  edge.hasArrow && !edge.arrowFromStartToEnd
                    ? `url(#cluster-arrow-${edge.id})`
                    : undefined
                }
                markerEnd={
                  edge.hasArrow && edge.arrowFromStartToEnd
                    ? `url(#cluster-arrow-${edge.id})`
                    : undefined
                }
              />
            </g>
          ))}
        </g>

        <g className={styles.nodeLayer}>
          {members.map((member) => {
            const position = nodePositions.get(member.id);

            if (!position) {
              return null;
            }

            return (
              <g key={member.id} transform={`translate(${position.x}, ${position.y})`}>
                <circle className={styles.nodeShadow} r={nodeRadius + 5} />
                <circle className={styles.nodeOuterRing} r={nodeRadius} />
                <circle className={styles.nodeInnerFill} r={nodeRadius - 6} />
                <text
                  className={styles.nodeLabel}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {member.name.split(" ").map((part, index, parts) => (
                    <tspan
                      key={`${member.id}-${part}-${index}`}
                      x="0"
                      dy={index === 0 ? `${parts.length > 1 ? -0.45 : 0}em` : "1.15em"}
                    >
                      {part}
                    </tspan>
                  ))}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
