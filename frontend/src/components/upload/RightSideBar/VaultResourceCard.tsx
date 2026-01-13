"use client";

import styles from "./VaultResourceCard.module.scss";

export default function VaultResourceCard() {
  return (
    <div className={styles.card}>
      {/* Glow icon behind */}
      <div className={styles.bgIcon}>
        <span className="material-symbols-outlined">shield_person</span>
      </div>

      {/* Top section */}
      <div className={styles.topRow}>
        <div className={styles.fileIcon}>
          <span className="material-symbols-outlined">folder_zip</span>
        </div>

        <div className={styles.info}>
          <h4>Project_Assets.zip</h4>
          <p>24.5 MB • ZIP/PDF</p>
        </div>
      </div>

      {/* Bottom */}
      <div className={styles.bottomRow}>
        <div className={styles.premium}>
          <span className="material-symbols-outlined">workspace_premium</span>
          <span>Attached Vault</span>
        </div>

        <button className={styles.btnDownload}>
          <span>Download</span>
          <span className="material-symbols-outlined">download</span>
        </button>
      </div>
    </div>
  );
}
