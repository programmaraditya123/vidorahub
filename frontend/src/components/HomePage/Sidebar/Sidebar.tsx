"use client";

import Link from "next/link";
import styles from "./Sidebar.module.scss";
import { userValidates } from "@/src/functions";
import VidorahubIcon from "@/src/icons/VidorahubIcon";

export default function Sidebar() {
  const menu = [
    { icon: "home", label: "Home" , link: '/'},
    { icon: "explore", label: "Explore" , link : '/explore' },
    { icon: "subscriptions", label: "Subscriptions" , link : '/subscriptions'},
    { icon: "history", label: "History" , link : '/history'},
  ];

  return (
    <aside className={styles.sidebar}>
      <nav className={`${styles.nav} glass-dark`}>
        {/* Logo */}
        <div className={`${styles.logo} neon-glow`}>
          <span className="material-symbols-outlined">play_circle</span>
        </div>

        {/* Menu Items */}
        {menu.map((item) => (
          <div key={item.label} className={styles.link}>
            <Link href={item.link}>
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className={`${styles.tooltip} glass`}>{item.label}</span>
            </Link>
          </div>
        ))}

        {/* Divider */}
        <div className={styles.divider} />

        {/* Profile */}
        <Link href={userValidates() ? '/profile' : '/signup'}>
        <div
          className={styles.profile}
        ><VidorahubIcon.UserIcon height={32} width={32}/></div>
        </Link>
      </nav>
    </aside>
  );
}
