import styles from "./BackgroundLayers.module.scss";

export default function BackgroundLayers() {
  return (
    <>
      <div className={styles.mesh} />
      <div className={styles.gradient} />
    </>
  );
}
