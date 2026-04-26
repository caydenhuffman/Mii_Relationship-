import type { PropsWithChildren, ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import styles from "./Modal.module.css";

interface ModalProps {
  title: string;
  open: boolean;
  onClose(): void;
  footer?: ReactNode;
}

export function Modal({
  children,
  title,
  open,
  onClose,
  footer,
}: PropsWithChildren<ModalProps>) {
  if (!open) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Edit island data</p>
            <h2>{title}</h2>
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="Close modal">
            Close
          </Button>
        </header>
        <div className={styles.content}>{children}</div>
        {footer ? <footer className={styles.footer}>{footer}</footer> : null}
      </div>
    </div>
  );
}
