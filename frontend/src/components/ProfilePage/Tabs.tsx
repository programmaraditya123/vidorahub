import styles from "../../../app/profile/Profile.module.scss";


export default function Tabs() {
  return (
    <div className={styles.tabs}>
      <a className={styles.activeTab}>VIDEOS</a>
      <a>VIBES</a>
      <a>PLAYLISTS</a>
    </div>
  );
}

