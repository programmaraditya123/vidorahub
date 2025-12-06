"use client";

import styles from "./Loader.module.scss";

export default function Loader() {
  return (
    <div className={styles.loaderWrapper}>
      <div className={styles.spinner}></div>
    </div>
  );
}
