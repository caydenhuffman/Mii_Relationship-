import { Handle, Position } from "@xyflow/react";
import { memo, type ReactNode } from "react";
import styles from "./ClusterOverviewGraph.module.css";

interface ClusterNodeProps {
  data: {
    label: ReactNode;
    polygonSides?: number;
  };
}

function ClusterNode({ data }: ClusterNodeProps) {
  return (
    <div className={styles.clusterNode}>
      <div className={styles.clusterNodeLabel}>{data.label}</div>
      <Handle type="source" position={Position.Top} id="top-source" style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="target" position={Position.Top} id="top-target" style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="source" position={Position.Right} id="right-source" style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="target" position={Position.Right} id="right-target" style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="source" position={Position.Bottom} id="bottom-source" style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="target" position={Position.Bottom} id="bottom-target" style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="source" position={Position.Left} id="left-source" style={{ opacity: 0, pointerEvents: "none" }} />
      <Handle type="target" position={Position.Left} id="left-target" style={{ opacity: 0, pointerEvents: "none" }} />
    </div>
  );
}

export default memo(ClusterNode);
