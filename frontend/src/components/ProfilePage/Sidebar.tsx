import styles from "../../../app/profile/Profile.module.scss";

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      {/* ABOUT SECTION */}
      <div className={styles.aboutCard}>
        <h3 className={styles.aboutTitle}>
          <span className={styles.infoIcon}>ⓘ</span>
          About the Artist
        </h3>

        <p className={styles.aboutText}>
          Zephyr Volt is a pioneer in digital hyper-surrealism. Based in the
          Neo-Berlin district, his work explores the intersection of kinetic
          motion and liquid typography. Each “Universe” is a crafted journey
          through the sublime.
        </p>

        <span className={styles.connectLabel}>CONNECT</span>

        <div className={styles.connectList}>
          <div className={styles.connectItem}>
            <span>🌐</span>
            <span>Instagram</span>
            <span className={styles.openIcon}>↗</span>
          </div>

          <div className={styles.connectItem}>
            <span>📷</span>
            <span>Facebook</span>
            <span className={styles.openIcon}>↗</span>
          </div>

          <div className={styles.connectItem}>
            <span>👥</span>
            <span>Join Discord</span>
            <span className={styles.openIcon}>↗</span>
          </div>
        </div>
      </div>

      {/* PERKS (UNCHANGED) */}
      {/* <div className={`${styles.perks} ${styles.glass}`}>
        <h4>Universe Perks</h4>
        <p>
          Join the inner circle for exclusive 8K downloads and BTS process
          videos.
        </p>
        <button>Upgrade Access</button>
      </div> */}
    </aside>
  );
}
