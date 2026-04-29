import { memo, type ReactNode } from "react";
import { Handle, Position } from "@xyflow/react";
import styles from "./RelationshipFlow.module.css";

interface MiiNodeProps {
  data: {
    label: ReactNode;
  };
}

function MiiNode({ data }: MiiNodeProps) {
  return (
    <div className={styles.nodeWrapper}>
      <Handle type="target" position={Position.Left} id="left" isConnectable={false} />
      <div className={styles.nodeInner}>{data.label}</div>
      <Handle type="source" position={Position.Right} id="right" isConnectable={false} />
    </div>
  );
}

export default memo(MiiNode);
