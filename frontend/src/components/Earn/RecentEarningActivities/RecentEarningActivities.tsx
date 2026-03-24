"use client";

import { useEffect, useState } from "react";
import styles from "./RecentEarningActivities.module.scss";
import { getEarning } from "@/src/lib/earning/earning";
import EarnBar from "../EarnBar/EarnBar";

type EarningApiResponse = {
  totals: {
    views: number;
    likes: number;
    dislikes: number;
    comments: number;
  };
  earnings: {
    viewsEarning: number;
    likesEarning: number;
    dislikesPenalty: number;
    commentsEarning: number;
  };
  totalEarning: number;
  totalPoints: number;
};

type Activity = {
  icon: string;
  action: string;
  source: string;
  points: string;
  date: string;
};

export default function RecentEarningActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    const loadEarning = async () => {
      const data: EarningApiResponse = await getEarning();

      if (!data) return;
      setTotalPoints(data.totalPoints || 0);

      const newActivities: Activity[] = [];

      // ✅ Views
      if (data.totals.views > 0) {
        newActivities.push({
          icon: "visibility",
          action: "Views Earned",
          source: `${data.totals.views} total views`,
          points: `+${data.totals.views} pts`,
          date: "Today",
        });
      }

      // ✅ Comments
      if (data.totals.comments > 0) {
        newActivities.push({
          icon: "chat_bubble",
          action: "Comments Earned",
          source: `${data.totals.comments} comments`,
          points: `+${data.totals.comments * 10} pts`,
          date: "Today",
        });
      }

      // 🚧 Likes (future)
      newActivities.push({
        icon: "favorite",
        action: "Likes Earnings (Coming Soon)",
        source: "We are working on likes earning criteria",
        points: "--",
        date: "--",
      });

      // 🚧 Dislikes (future)
      newActivities.push({
        icon: "thumb_down",
        action: "Dislikes Impact (Coming Soon)",
        source: "We are working on dislikes earning criteria",
        points: "--",
        date: "--",
      });

      // 🚧 Shares (future)
      newActivities.push({
        icon: "share",
        action: "Shares Earnings (Coming Soon)",
        source: "We are working on shares earning criteria",
        points: "--",
        date: "--",
      });

      setActivities(newActivities);
    };

    loadEarning();
  }, []);

  return (
    <>
    <EarnBar totalPoints={totalPoints}/>
    <section className={styles.wrapper}>
      <div className={styles.header}>
        <h3>Recent Earning Activities</h3>
      </div>

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
    </>
  );
}