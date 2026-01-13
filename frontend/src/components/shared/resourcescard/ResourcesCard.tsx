"use client";

import styles from "./ResourcesCard.module.scss";

interface Props {
  filename?: string;
  size?: string;
  onDownload?: () => void;
}

export default function ResourcesCard({
  filename = "Project_Assets.zip",
  size = "24.5 MB • ZIP/PDF",
  onDownload,
}: Props) {
  return (
    <div className={`${styles.card} vaultGlow glass-dark`}>
      {/* Faded Icon Background */}
      <div className={styles.bigIcon}>
        <span className="material-symbols-outlined">shield_person</span>
      </div>

      <div className={styles.row}>
        <div className={styles.iconBox}>
          <span className="material-symbols-outlined">folder_zip</span>
        </div>

        <div className={styles.info}>
          <h4>{filename}</h4>
          <p>{size}</p>
        </div>
      </div>

      <div className={styles.bottomRow}>
        <div className={styles.badge}>
          <span className="material-symbols-outlined">workspace_premium</span>
          <span>Attached Vault</span>
        </div>

        <button className={styles.download} onClick={onDownload}>
          <span>Download</span>
          <span className="material-symbols-outlined">download</span>
        </button>
      </div>
    </div>
  );
}
