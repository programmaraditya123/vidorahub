"use client";

import Sidebar from "@/src/components/HomePage/Sidebar/Sidebar";
import styles from "./Upload.module.scss";
import Link from "next/link";

export default function Upload() {
  return (
    <>
    <Sidebar/>
    <div className={styles.overlay}>
      <div className={`${styles.modal} glass-dark`}>
        <h2 className={styles.title}>What you want to Upload?</h2>

        <div className={styles.options}>
          <div className={`${styles.card} neon-glow`}>
            <Link href={'/uploadvideo'}>
            <span className="material-symbols-outlined">movie</span>
            <h3>Video</h3>
          </Link>
          </div>
          
          <div className={`${styles.card} neon-glow`}>
          <Link href={'/uploadvibe'}>
            <span className="material-symbols-outlined">smart_display</span>
            <h3>Vibes</h3>
          </Link>
          </div>
        </div>

        {/* Note */}
        <p className={styles.note}>
          Vibes are designed for quick moments — videos under
          <strong> 60 seconds</strong>.  
          For longer content, please upload using
          <strong> Video</strong>.
        </p>
      </div>
    </div>
    </>
  );
}