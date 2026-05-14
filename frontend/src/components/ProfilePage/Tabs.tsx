"use client";

import { useRouter, useSearchParams } from "next/navigation";

import styles from "../../../app/profile/Profile.module.scss";

type TabsProps = {
  channelId?: string;
};

export default function Tabs({
  channelId,
}: TabsProps) {
  const router = useRouter();

  const searchParams = useSearchParams();

  const activeTab =
    searchParams.get("tab") || "videos";

  const handleTabChange = (tab: string) => {
    const basePath = channelId
      ? `/channel/${channelId}`
      : "/profile";

    router.replace(`${basePath}?tab=${tab}`);
  };

  return (
    <div className={styles.tabs}>
      <a
        className={
          activeTab === "videos"
            ? styles.activeTab
            : styles.tab
        }
        onClick={() =>
          handleTabChange("videos")
        }
      >
        VIDEOS
      </a>

      <a
        className={
          activeTab === "store"
            ? styles.activeTab
            : styles.tab
        }
        onClick={() =>
          handleTabChange("store")
        }
      >
        My Store
      </a>
    </div>
  );
}


// "use client";

// import { useRouter, useSearchParams } from "next/navigation";
// import styles from "../../../app/profile/Profile.module.scss";

// type TabsProps = {
//   channelId: string;
// };

// export default function Tabs({
//   channelId,
// }: TabsProps) {
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   const activeTab = searchParams.get("tab") || "videos";

//   const handleTabChange = (tab: string) => {
//     router.replace(`/channel/${channelId}?tab=${tab}`);
//   };

//   return (
//     <div className={styles.tabs}>
//       <a
//         className={
//           activeTab === "videos"
//             ? styles.activeTab
//             : styles.tab
//         }
//         onClick={() => handleTabChange("videos")}
//       >
//         VIDEOS
//       </a>

//       <a
//         className={
//           activeTab === "store"
//             ? styles.activeTab
//             : styles.tab
//         }
//         onClick={() => handleTabChange("store")}
//       >
//         My Store
//       </a>
//     </div>
//   );
// }

// import styles from "../../../app/profile/Profile.module.scss";

// type TabsProps = {
//   activeTab: string;
//   onTabChange: (tab: string) => void;
// };

// export default function Tabs({
//   activeTab,
//   onTabChange,
// } : TabsProps) {
//   return (
//     <div className={styles.tabs}>
//       <a className={activeTab === "VIDEOS" ? styles.activeTab : styles.tab} onClick={() => onTabChange("VIDEOS")}>
//         VIDEOS
//       </a>
//       {/* <a>VIBES</a> */}
//       {/* <a>PLAYLISTS</a> */}
//       <a className={activeTab === "PRODUCTS" ? styles.activeTab : styles.tab} onClick={() => onTabChange("PRODUCTS")}>
//         My Store
//       </a>
//     </div>
//   );
// }

