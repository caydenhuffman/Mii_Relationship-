import type { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";
import { useIsland } from "@/hooks/useIsland";
import styles from "./AppShell.module.css";

const navItems = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/miis", label: "Miis" },
  { to: "/graph", label: "Full Graph" },
  { to: "/graph/focus", label: "Focused Graph" },
  { to: "/clusters", label: "Clusters" },
];

export function AppShell({ children }: PropsWithChildren) {
  const { islandData, status, adapterLabel } = useIsland();

  return (
    <div className={styles.shell}>
      <div className={styles.backdrop} />
      <header className={styles.header}>
        <div className={styles.brandBlock}>
          <span className={styles.badge}>Tomodachi Life: Living the Dream</span>
          <h1>Relationship Tracker</h1>
          <p>
            A playful island dashboard for Miis, directed feelings, and friend-group
            vibes.
          </p>
        </div>
        <div className={styles.headerMeta}>
          <div>
            <strong>{islandData.miis.length}</strong>
            <span>Miis</span>
          </div>
          <div>
            <strong>{islandData.relationships.length}</strong>
            <span>Directed ties</span>
          </div>
          <div>
            <strong>{status === "ready" ? "Ready" : "Loading"}</strong>
            <span>{adapterLabel}</span>
          </div>
        </div>
      </header>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.active : ""}`.trim()
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className={styles.main}>{children}</main>
    </div>
  );
}
