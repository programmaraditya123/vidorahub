import styles from "../../../app/profile/Profile.module.scss";

type ProfileData = {
  _id: string;
  name: string;
  subscriber: number;
  creator: boolean;
  totalviews: number;
  totalvideos: number;
};

type ProfileCardProps = {
  data: ProfileData;
};

export default function ProfileCard({ data }: ProfileCardProps) {
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
            <h1 className={styles.name}>{data.name}</h1>

            <div className={styles.verified}>
              {data.creator ? "Verified Creator" : "User"}
            </div>

            <div className={styles.stats}>
              <div className={styles.stat}>
                <span>SUBSCRIBERS</span>
                <b>{data.subscriber}</b>
              </div>

              <div className={styles.stat}>
                <span>Total Views</span>
                <b>{data.totalviews}</b>
              </div>

              <div className={styles.stat}>
                <span>Videos</span>
                <b>{data.totalvideos}</b>
              </div>
            </div>
          </div>
        </div>

        {/* <div className={styles.joinBox}>
          <button className={styles.joinBtn}>+</button>
          <span className={styles.joinLabel}>Join Universe</span>
        </div> */}
      </div>
    </div>
  );
}
