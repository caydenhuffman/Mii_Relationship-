import type { HTMLAttributes, PropsWithChildren } from "react";
import styles from "./Card.module.css";

export function Card({
  children,
  className = "",
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLElement>>) {
  return (
    <section className={`${styles.card} ${className}`.trim()} {...props}>
      {children}
    </section>
  );
}
