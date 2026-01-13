"use client";

import Image from "next/image";
import styles from "./Navbar2.module.scss";
import Link from "next/link";

export default function Navbar2() {
  return (
    <nav className={styles.nav}>
      
      {/* LEFT — Brand */}
      <div className={styles.brand}>
        <span className="material-symbols-outlined">play_circle</span>
        <Link href='/'><h1>VidoraHub</h1></Link>
        
      </div>

      {/* CENTER — Search */}
      <div className={styles.searchWrapper}>
        <span className="material-symbols-outlined">search</span>
        <input type="text" placeholder="Search the Hub..." />
      </div>

      {/* RIGHT — Actions */}
      <div className={styles.actions}>
        <button className={styles.notifyBtn}>
          <span className="material-symbols-outlined">notifications</span>
          <span className={styles.dot}></span>
        </button>

        <div
          className={styles.avatar}
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDXT7FOBHU5aqFiL_PQQ8zVR7OKnI2sbWj7b-b6Hj212lNdH9OhL_mgRq-IkjXBBUNHrFJa2v5lXyNHmorwLAAG_B9HMlLZxwNZ7uS4JQCOHV9pkV9y9-25Y0m95nqRfacFSjRd-OqA2uadcmV5s01aH3_-3SEBH0dXBXDJjULeroBJ7EPCCrhJXyvB87vhrvV-M4Jgu9rfgYgyVqVYdGAZUp0pRMUMQYJfycdHfN5s-_RMUYE4gBv3dJuveMHcSV7y0MMEHazxztPQ')",
          }}
        ></div>
      </div>

    </nav>
  );
}
