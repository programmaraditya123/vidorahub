import styles from "../../../app/history/history.module.scss";

export default function Analytics() {
  return (
    <aside className={styles.analytics}>
      <h3>Watch Analytics</h3>

      {/* Heatmap */}
      <div>
        <p className={styles.analyticsTitle}>DAILY HEAT-MAP</p>
        <span className={styles.analyticsMonth}>Mar 2024</span>

        <div className={styles.heatmap}>
          <div className={`${styles.heatCell} ${styles.low}`} />
          <div className={`${styles.heatCell} ${styles.mid}`} />
          <div className={`${styles.heatCell} ${styles.high}`} />
          <div className={`${styles.heatCell} ${styles.mid}`} />
          <div className={`${styles.heatCell} ${styles.high}`} />
          <div className={`${styles.heatCell} ${styles.low}`} />
          <div className={`${styles.heatCell} ${styles.mid}`} />

          <div className={`${styles.heatCell} ${styles.mid}`} />
          <div className={`${styles.heatCell} ${styles.low}`} />
          <div className={`${styles.heatCell} ${styles.high}`} />
          <div className={`${styles.heatCell} ${styles.mid}`} />
          <div className={`${styles.heatCell} ${styles.high}`} />
          <div className={`${styles.heatCell} ${styles.low}`} />
          <div className={`${styles.heatCell} ${styles.mid}`} />
        </div>

        {/* Legend */}
        <div className={styles.legend}>
          <span>LESS</span>
          <div className={styles.legendDots}>
            <span />
            <span />
            <span />
            <span />
          </div>
          <span>MORE</span>
        </div>
      </div>

      {/* Categories */}
      <div>
        <p className={styles.analyticsTitle}>TOP CATEGORIES</p>

        <div className={styles.category}>
          <label>
            <span>Technology</span>
            <span>42%</span>
          </label>
          <div className={styles.catBar}>
            <span style={{ width: "42%" }} />
          </div>
        </div>

        <div className={styles.category}>
          <label>
            <span>Education</span>
            <span>28%</span>
          </label>
          <div className={styles.catBar}>
            <span style={{ width: "28%" }} />
          </div>
        </div>

        <div className={styles.category}>
          <label>
            <span>Gaming</span>
            <span>15%</span>
          </label>
          <div className={styles.catBar}>
            <span style={{ width: "15%" }} />
          </div>
        </div>

        <div className={styles.category}>
          <label>
            <span>Music</span>
            <span>10%</span>
          </label>
          <div className={styles.catBar}>
            <span style={{ width: "10%" }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stat}>
        <p>Peak Watch Time</p>
        <h4>10:45 AM</h4>
      </div>

      <div className={styles.stat}>
        <p>Monthly Total</p>
        <h4>
          128.5 <span>hrs</span>
        </h4>
      </div>
    </aside>
  );
}
