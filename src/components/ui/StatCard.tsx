import { Card } from "@/components/ui/Card";
import styles from "./StatCard.module.css";

interface StatCardProps {
  label: string;
  value: number | string;
  accent?: string;
  helper?: string;
}

export function StatCard({ label, value, accent, helper }: StatCardProps) {
  return (
    <Card className={styles.card}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value} style={accent ? { color: accent } : undefined}>
        {value}
      </p>
      {helper ? <p className={styles.helper}>{helper}</p> : null}
    </Card>
  );
}
