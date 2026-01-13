"use client";

import Link from "next/link";
import styles from "./Header.module.scss";

export default function Header() {
  return (
    <header className={styles.header}>
      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <div className={styles.searchWrapper}>
          <span className={`material-symbols-outlined ${styles.searchIcon}`}>
            search
          </span>

          <input
            type="text"
            placeholder="Search the Hub..."
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className={styles.actions}>
        <button className={`${styles.iconBtn} glass-dark`}>
          <span className="material-symbols-outlined">notifications</span>
          <span className={styles.dot}></span>
        </button>
        
        <Link href='uploadvideo'>
        <button className={`${styles.uploadBtn} glass-dark`}>
          Upload
        </button>
        </Link>
        
      </div>
    </header>
  );
}
