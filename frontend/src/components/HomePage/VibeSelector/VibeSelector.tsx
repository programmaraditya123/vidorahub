"use client";

import styles from "./VibeSelector.module.scss";

export default function VibeSelector() {
  const vibes = [
    "Aesthetic",
    "Cinematic",
    "High Octane",
    "Chill",
    "Tech Noir",
    "Lo-Fi",
    "Deep Focus",
  ];

  return (
    <div className={styles.wrapper}>
      {/* EXPANDING MENU */}
      <div className={`${styles.menu} glass`}>
        <p className={styles.label}>Choose your Vibe</p>

        {vibes.map((v) => (
          <button key={v} className={styles.vibeBtn}>
            {v}
          </button>
        ))}
      </div>

      {/* TRIGGER BUTTON */}
      <button className={`${styles.fab} glass`}>
        <span className="material-symbols-outlined">auto_awesome</span>
      </button>
    </div>
  );
}
