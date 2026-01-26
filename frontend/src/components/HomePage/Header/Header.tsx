"use client";

import Link from "next/link";
import styles from "./Header.module.scss";
import { userValidates } from "@/src/functions";
import VidorahubIcon from "@/src/icons/VidorahubIcon";

export default function Header() {
  return (
    <header className={styles.header}>
      {/* Search Bar */}
      <div className={styles.searchContainer}>
        {/* <div className={styles.searchWrapper}>
          <span className={`material-symbols-outlined ${styles.searchIcon}`}>
            search
          </span>

          <input
            type="text"
            placeholder="Search the Hub..."
            className={styles.searchInput}
          />
        </div> */}
        <p className={styles.homeLogo}><VidorahubIcon.VidorahubIcon height={28} width={28} color="purple"/> VidoraHub</p>
      </div>

      {/* Right Actions */}
      <div className={styles.actions}>
        <button className={`${styles.iconBtn} glass-dark`}>
          <span className="material-symbols-outlined">notifications</span>
          <span className={styles.dot}></span>
        </button>
        
        <Link href={userValidates() ? 'uploadvideo' : 'login'}>
        <button className={`${styles.uploadBtn} glass-dark`}>
          {/* Upload */}
          {userValidates() ? "Upload" : "Login"}
        </button>
        </Link>
        
      </div>
    </header>
  );
}
