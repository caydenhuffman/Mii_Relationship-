import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ButtonLink } from "@/components/ui/ButtonLink";
import styles from "./EmptyState.module.css";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
}: EmptyStateProps) {
  return (
    <Card className={styles.state}>
      <div>
        <p className={styles.emoji}>🏝️</p>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {actionLabel && actionTo ? (
        <ButtonLink to={actionTo}>{actionLabel}</ButtonLink>
      ) : null}
      {actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
    </Card>
  );
}
