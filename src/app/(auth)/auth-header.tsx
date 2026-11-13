import styles from "./auth.module.css";

export function AuthHeader({ firstLogin = false }: { firstLogin?: boolean }) {
  return (
    <header className={styles.header}>
      <span className={styles.brand}>
        <span className={styles.monogram} aria-hidden="true">ES</span>
        Event Survey
      </span>
      {firstLogin && <span className={styles.manager}>Event Manager</span>}
    </header>
  );
}

