"use client";

import styles from "./VibePointsBreakdown.module.scss";

const cards = [
  {
    title: "Views",
    subtitle: "10 points per 1,000",
    value: "10x",
    icon: "visibility",
  },
  {
    title: "Shares",
    subtitle: "5 points per share",
    value: "5x",
    icon: "share",
  },
  {
    title: "Likes",
    subtitle: "2 points per like",
    value: "2x",
    icon: "favorite",
  },
  {
    title: "Engagement",
    subtitle: "High comment ratio bonus",
    value: "+25%",
    icon: "chat_bubble",
  },
];

export default function VibePointsBreakdown() {
  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <h2>Points Earning Breakdown</h2>
        <p>Understand how your creativity translates into rewards.</p>
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