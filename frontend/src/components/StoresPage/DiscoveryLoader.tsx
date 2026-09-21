import styles from "./StoresPage.module.scss";

export default function DiscoveryLoader({ type }: { type: "products" | "stores" }) {
  return (
    <div className={styles.discoveryLoader} role="status" aria-live="polite">
      <span className={styles.loadingSpinner} aria-hidden="true" />
      <p>Finding trending {type} for you</p>
      <span className={styles.loadingHint}>Hold for a sec</span>
    </div>
  );
}
