import styles from "./UnderDevelopment.module.scss";

export default function UnderDevelopment() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.nebulaBg}></div>
      <div className={styles.gridOverlay}></div>

      <main className={styles.main}>
        <div className={styles.logoArea}>
          <div className={styles.floatingV}>
            <div className={styles.vLayerOne}></div>
            <div className={styles.vLayerTwo}></div>

            <span className={`material-symbols-outlined ${styles.icon1}`}>
              electric_bolt
            </span>
            <span className={`material-symbols-outlined ${styles.icon2}`}>
              auto_fix_high
            </span>
            <span className={`material-symbols-outlined ${styles.icon3}`}>
              science
            </span>

            <div className={styles.lines}>
              <div className={styles.line1}></div>
              <div className={styles.line2}></div>
            </div>
          </div>
        </div>

        <div className={styles.textArea}>
          <h1 className={styles.title}>Upgrading The Hub</h1>
          <p className={styles.subtitle}>
            THIS SECTION IS CURRENTLY UNDER DEVELOPMENT
          </p>
        </div>
      </main>

      {/* <footer className={styles.footer}>
        <div>
          <span className={styles.protocol}>
            Maintenance Protocol v4.0.2
          </span>
          <span className={styles.copy}>© 2024 VidoraHub Dimensions</span>
        </div>

        <div className={styles.socials}>
          <div className={styles.iconBtn}>
            <span className="material-symbols-outlined">public</span>
          </div>
          <div className={styles.iconBtn}>
            <span className="material-symbols-outlined">groups</span>
          </div>
          <div className={styles.iconBtn}>
            <span className="material-symbols-outlined">forum</span>
          </div>
        </div>
      </footer> */}
    </div>
  );
}
