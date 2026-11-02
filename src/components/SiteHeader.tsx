import Link from "next/link";
import styles from "./site.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerInner}`}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true">
            ★
          </span>
          <span>
            Guardiões <em>da Leitura</em>
          </span>
        </Link>
        <nav aria-label="Principal" className={styles.nav}>
          <Link href="/">Fases</Link>
          <Link href="/ranking">Ranking geral</Link>
          <Link href="/professor" className={styles.navTeacher}>
            Professor
          </Link>
        </nav>
      </div>
    </header>
  );
}
