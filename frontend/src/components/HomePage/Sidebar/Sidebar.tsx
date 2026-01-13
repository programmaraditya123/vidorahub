"use client";

import styles from "./Sidebar.module.scss";

export default function Sidebar() {
  const menu = [
    { icon: "home", label: "Home" },
    { icon: "explore", label: "Explore" },
    { icon: "subscriptions", label: "Subscriptions" },
    { icon: "history", label: "History" },
  ];

  return (
    <aside className={styles.sidebar}>
      <nav className={`${styles.nav} glass-dark`}>
        {/* Logo */}
        <div className={`${styles.logo} neon-glow`}>
          <span className="material-symbols-outlined">play_circle</span>
        </div>

        {/* Menu Items */}
        {menu.map((item) => (
          <div key={item.label} className={styles.link}>
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className={`${styles.tooltip} glass`}>{item.label}</span>
          </div>
        ))}

        {/* Divider */}
        <div className={styles.divider} />

        {/* Profile */}
        <div
          className={styles.profile}
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDXT7FOBHU5aqFiL_PQQ8zVR7OKnI2sbWj7b-b6Hj212lNdH9OhL_mgRq-IkjXBBUNHrFJa2v5lXyNHmorwLAAG_B9HMlLZxwNZ7uS4JQCOHV9pkV9y9-25Y0m95nqRfacFSjRd-OqA2uadcmV5s01aH3_-3SEBH0dXBXDJjULeroBJ7EPCCrhJXyvB87vhrvV-M4Jgu9rfgYgyVqVYdGAZUp0pRMUMQYJfycdHfN5s-_RMUYE4gBv3dJuveMHcSV7y0MMEHazxztPQ')",
          }}
        ></div>
      </nav>
    </aside>
  );
}
