import Link from "next/link";
import styles from "../../../app/history/history.module.scss";

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>▶</div>
          <div>
            <Link href={'/'} className={styles.linktext}>
            <h1 >VidoraHub</h1>
            </Link>
            <p>POWER USER</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          <a className={styles.navItem}>
            <span className={styles.navIcon}>⌗</span>
            Dashboard
          </a>

          <a className={`${styles.navItem} ${styles.active}`}>
            <span className={styles.navIcon}>⟳</span>
            Archive
          </a>

          <a className={styles.navItem}>
            <span className={styles.navIcon}>🔒</span>
            Vault
          </a>

          <a className={styles.navItem}>
            <span className={styles.navIcon}>📊</span>
            Analytics
          </a>

          <a className={styles.navItem}>
            <span className={styles.navIcon}>⚙</span>
            Settings
          </a>
        </nav>
      </div>

      {/* Storage */}
      <div className={styles.storage}>
        <p>Storage Usage</p>
        <div className={styles.progress}>
          <span />
        </div>
        <button>Upgrade Pro</button>
      </div>
    </aside>
  );
}