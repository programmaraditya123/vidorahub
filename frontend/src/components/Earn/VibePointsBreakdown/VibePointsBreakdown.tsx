"use client";

import styles from "./VibePointsBreakdown.module.scss";

const cards = [
  {
    title: "Views",
    subtitle: "1 point per view",
    value: "1x",
    icon: "visibility",
  },
  {
    title: "Likes",
    subtitle: "5 points per like",
    value: "5x",
    icon: "favorite",
  },
  {
    title: "Comments",
    subtitle: "10 points per comment",
    value: "10x",
    icon: "chat_bubble",
  },
  {
    title: "Dislikes",
    subtitle: "-2 points per dislike",
    value: "-2x",
    icon: "thumb_down",
  },
];

export default function VibePointsBreakdown() {
  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <h2>Points Earning Breakdown</h2>
        <p>Every interaction on your content earns you points.</p>
      </div>

      <div className={styles.grid}>
        {cards.map((card, index) => (
          <div key={index} className={styles.card}>
            <div className={styles.iconWrapper}>
              <span className="material-symbols-outlined">
                {card.icon}
              </span>
            </div>

            <h3 className={styles.head3}>{card.title}</h3>
            <p className={styles.subtitle}>{card.subtitle}</p>

            <div className={styles.divider} />

            <div className={styles.value}>{card.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}