"use client";

import styles from "./RecentEarningActivities.module.scss";

const activities = [
  {
    icon: "visibility",
    action: "Milestone: 50k Views",
    source: 'Video "Summer Vibes 2024"',
    points: "+500",
    date: "Oct 24, 2024",
  },
  {
    icon: "share",
    action: "Social Shares",
    source: 'Video "Cooking Tutorial"',
    points: "+120",
    date: "Oct 23, 2024",
  },
  {
    icon: "chat_bubble",
    action: "Engagement Bonus",
    source: "Monthly Performance",
    points: "+2,400",
    date: "Oct 22, 2024",
  },
  {
    icon: "favorite",
    action: "Reaction Reward",
    source: 'Video "Tech Review"',
    points: "+85",
    date: "Oct 21, 2024",
  },
];

export default function RecentEarningActivities() {
  return (
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <h3>Recent Earning Activities</h3>
        {/* <span className={styles.viewAll}>View All</span> */}
      </div>

      {/* Desktop Table */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ACTION</th>
              <th>SOURCE</th>
              <th>POINTS EARNED</th>
              <th>DATE</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((item, index) => (
              <tr key={index}>
                <td>
                  <div className={styles.actionCell}>
                    <div className={styles.iconBox}>
                      <span className="material-symbols-outlined">
                        {item.icon}
                      </span>
                    </div>
                    {item.action}
                  </div>
                </td>
                <td className={styles.source}>{item.source}</td>
                <td className={styles.points}>{item.points}</td>
                <td className={styles.date}>{item.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className={styles.mobileList}>
        {activities.map((item, index) => (
          <div key={index} className={styles.mobileCard}>
            <div className={styles.mobileTop}>
              <div className={styles.iconBox}>
                <span className="material-symbols-outlined">
                  {item.icon}
                </span>
              </div>
              <div>
                <p className={styles.mobileAction}>{item.action}</p>
                <p className={styles.mobileSource}>{item.source}</p>
              </div>
            </div>

            <div className={styles.mobileBottom}>
              <span className={styles.points}>{item.points}</span>
              <span className={styles.date}>{item.date}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}