"use client";

import { useRouter } from "next/navigation";
import styles from "../../../app/profile/Profile.module.scss";
import Link from "next/link";
import { useEffect, useState } from "react";

type Platform = {
  platform: string;
  url: string;
  audience: number;
};

type SidebarProps = {
  bio?: string;
  platforms?: Platform[];
};

export default function Sidebar({ bio, platforms }: SidebarProps) {
  const router = useRouter();
  const [token,setToken] = useState<string | null>(null)

  const hasData = bio || (platforms && platforms.length > 0);

  const iconMap: Record<string, string> = {
    Instagram: "photo_camera",
    Facebook: "facebook",
    VidoraHub: "play_circle",
    Twitter: "alternate_email",
    YouTube: "smart_display",
    LinkedIn: "work",
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    setToken(storedToken)

  },[])

   

  return (
    <aside className={styles.sidebar}>
      <div className={styles.aboutCard}>
        {/* HEADER */}
        <div className={styles.headerRow}>
          <h3 className={styles.aboutTitle}>
            <span className={styles.infoIcon}>ⓘ</span>
            About the Creator
          </h3>
       
          <Link href={`https://studio.vidorahub.com/login/${token}`} target="_blank">
          <button
            className={styles.editBtn}
          >
            {hasData ? "Edit" : "Add"}
          </button>
          </Link>
        </div>

        {/* BIO */}
        {bio ? (
          <p className={styles.aboutText}>{bio}</p>
        ) : (
          <p className={styles.emptyText}>
            No bio added yet. Tell people about yourself 🚀
          </p>
        )}

        {/* CONNECT */}
        <span className={styles.connectLabel}>CONNECT</span>

        <div className={styles.connectList}>
          {platforms && platforms.length > 0 ? (
            platforms.map((item, index) => (
              <a
                key={index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.connectItem}
              >
                {/* ICON */}
                <span className="material-symbols-outlined">
                  {iconMap[item.platform] || "language"}
                </span>

                {/* NAME + AUDIENCE */}
                <div className={styles.platformName}>
                  <span>{item.platform}</span>
                  {/* <span className={styles.audience}>
                    {item.audience}
                  </span> */}
                </div>

                <span className={styles.openIcon}>↗</span>
              </a>
            ))
          ) : (
            <div
              className={`${styles.connectItem} ${styles.emptyItem}`}
              onClick={() => router.push("/profile/edit")}
            >
              <span className="material-symbols-outlined">
                add_link
              </span>
              <span>Add your social links</span>
              <span className={styles.openIcon}>↗</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}