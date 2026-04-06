"use client";

import Link from "next/link";
import styles from "./Sidebar.module.scss";
import { userValidates } from "@/src/functions";
import VidorahubIcon from "@/src/icons/VidorahubIcon";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const pathName = usePathname();

  const menu = [
    { icon: "home",             label: "Home",          link: "/"         },
    { icon: "search",           label: "Search",        link: "/search"   },
    { icon: "animated_images",  label: "Vibes", link: "/vibes" },
    { icon: "currency_rupee",   label: "Earn",          link: "/earn"     },
  ];

  return (
    <aside className={styles.sidebar}>
      <nav className={`${styles.nav} glass-dark`}>
        {/* Logo */}
        <div className={styles.logo}>
          <span className="material-symbols-outlined">play_circle</span>
        </div>

        {/* Menu Items */}
        {menu.map((item) => {
          const isActive = pathName === item.link;
          return (
            <div
              key={item.label}
              className={`${styles.link} ${isActive ? styles.active : ""}`}
            >
              <Link href={item.link}>
                <span className={`material-symbols-outlined ${styles.icon}`}>
                  {item.icon}
                </span>
                <span className={`${styles.tooltip} glass`}>{item.label}</span>
              </Link>
            </div>
          );
        })}

        {/* Divider */}
        <div className={styles.divider} />

        {/* Profile */}
        <Link href={userValidates() ? "/profile" : "/signup"}>
          <div className={styles.profile}>
            <VidorahubIcon.UserIcon height={22} width={22} />
          </div>
        </Link>
      </nav>
    </aside>
  );
}