import styles from "../../../app/history/history.module.scss";

export default function Timeline() {
  return (
    <div className={styles.timeline}>
      {/* Icon at top (optional) */}
      <span className={styles.timelineIcon}>⟳</span>

      {/* Time ticks */}
      <div className={styles.tick}>
        <span>12 PM</span>
        <div className={styles.tickLine} />
      </div>

      <div className={`${styles.tick} ${styles.activeTick}`}>
        <span>10 AM</span>
        <div className={styles.tickLineActive} />
      </div>

      <div className={styles.tick}>
        <span>08 AM</span>
        <div className={styles.tickLine} />
      </div>

      <div className={styles.tick}>
        <span>06 AM</span>
        <div className={styles.tickLine} />
      </div>

      <div className={styles.separator} />

      <div className={styles.tick}>
        <span>YEST</span>
        <div className={styles.tickLine} />
      </div>

      <div className={styles.tick}>
        <span>MAR 12</span>
        <div className={styles.tickLine} />
      </div>
    </div>
  );
}
