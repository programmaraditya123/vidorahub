import styles from "./VibeStep.module.scss";

const VIBES = [
  { id: "gaming", label: "Gaming", icon: "sports_esports" },
  { id: "music", label: "Music", icon: "music_note" },
  { id: "tech", label: "Tech", icon: "memory" },
  { id: "art", label: "Art & Design", icon: "palette" },
  { id: "cinema", label: "Cinema", icon: "movie" },
  { id: "science", label: "Science", icon: "rocket_launch" },
  { id: "lifestyle", label: "Lifestyle", icon: "fitness_center" },
  { id: "travel", label: "Travel", icon: "public" },
];

type Props = {
  selected: string[];
  setSelected: (vibes: string[]) => void;
  onBack: () => void;
  onNext: () => void;
};

export default function VibeStep({
  selected,
  setSelected,
  onBack,
  onNext,
}: Props) {
  const toggleVibe = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((v) => v !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  return (
    <div className={styles.card}>
      {/* Progress */}
      <div className={styles.progress}>
        <div>
          <span className={styles.phase}>Phase 02</span>
          <h3>The Pulse (Interests)</h3>
        </div>
        <span className={styles.percent}>75% Complete</span>
      </div>

      <div className={styles.bar}>
        <div className={styles.barFill}></div>
      </div>

      {/* Headline */}
      <div className={styles.header}>
        <h1>What defines your journey?</h1>
        <p>
          Select the energy clusters that match your pulse. We&apos;ll curate the
          constellation for you.
        </p>
      </div>

      {/* Vibes */}
      <div className={styles.vibeCloud}>
        {VIBES.map((vibe) => (
          <button
            key={vibe.id}
            className={`${styles.vibeBubble} ${
              selected.includes(vibe.id) ? styles.active : ""
            }`}
            onClick={() => toggleVibe(vibe.id)}
            type="button"
          >
            <span className="material-symbols-outlined">{vibe.icon}</span>
            {vibe.label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button onClick={onBack} className={styles.backBtn}>
          Back
        </button>
        <button onClick={onNext} className={styles.nextBtn}>
          Continue to Gateway →
        </button>
      </div>
    </div>
  );
}
