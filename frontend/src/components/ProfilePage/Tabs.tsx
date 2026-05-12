import styles from "../../../app/profile/Profile.module.scss";

type TabsProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export default function Tabs({
  activeTab,
  onTabChange,
} : TabsProps) {
  return (
    <div className={styles.tabs}>
      <a className={activeTab === "VIDEOS" ? styles.activeTab : styles.tab} onClick={() => onTabChange("VIDEOS")}>
        VIDEOS
      </a>
      {/* <a>VIBES</a> */}
      {/* <a>PLAYLISTS</a> */}
      <a className={activeTab === "PRODUCTS" ? styles.activeTab : styles.tab} onClick={() => onTabChange("PRODUCTS")}>
        My Store
      </a>
    </div>
  );
}

