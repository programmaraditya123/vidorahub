import styles from "../../../app/profile/Profile.module.scss";


export default function ProfileCard() {
  return (
    <div className={`${styles.profileCard} ${styles.glass}`}>
      <div className={styles.profileRow}>
        <div className={styles.profileLeft}>
          <div className={styles.avatarPulse}>
            <div
              className={styles.avatarLarge}
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDk4A2vp9K-OQ3Cv_NhDpq9r3E-ub-S3nBqylu_cCRNbPfjMonkPp-XlgKn_IXVHh9eWl-DS8MM4O2GuK7FgnW4OLNg0cBPLYzHDGOFOQsnLg7M5l5AC40w9ywI_oaaQzgT7NuToZpDo8xR0ZgYgeNEJ1594zx9Z1vYVI6KMLj5kWSphOJQfx9GK-nPWWNaMERreWYajFRaKUtUG5oILZKwMO2LRtun3R3Re_fBFjFrf3_rLei3ATVq3CBj1DSsNotoVtzG-e40xDNf')",
              }}
            />
          </div>

          <div>
            <h1 className={styles.name}>ZEPHYR VOLT</h1>

            <div className={styles.verified}>
              Verified Universe Architect
            </div>

            <div className={styles.stats}>
              <div className={styles.stat}>
                <span>Followers</span>
                <b>2.4M</b>
              </div>
              <div className={styles.stat}>
                <span>Vibe Score</span>
                <b>98.2</b>
              </div>
              <div className={styles.stat}>
                <span>Videos</span>
                <b>142</b>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.joinBox}>
          <button className={styles.joinBtn}>+</button>
          <span className={styles.joinLabel}>Join Universe</span>
        </div>
      </div>
    </div>
  );
}
