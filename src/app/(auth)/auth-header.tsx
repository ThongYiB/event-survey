import styles from "./auth.module.css";

export function AuthHeader({ firstLogin = false }: { firstLogin?: boolean }) {
  return (
    <header className={styles.header}>
      <span className={styles.brand}>
        {firstLogin ? (
          <span className={styles.monogram} aria-hidden="true">ES</span>
        ) : (
          <span className={styles.scanMark} aria-hidden="true" />
        )}
        Event Survey
      </span>
      {firstLogin && <span className={styles.manager}>Event Manager</span>}
    </header>
  );
}

