import styles from "./SearchGrid.module.scss";

interface VideoCardProps {
  image: string;
  title: string;
  creator: string;
  time: string;
}

export default function VideoCard({
  image,
  title,
  creator,
  time,
}: VideoCardProps) {
  return (
    <div className={styles.card}>
      <div
        className={styles.thumb}
        style={{ backgroundImage: `url(${image})` }}
      >
        <span className={styles.duration}>{time}</span>
        <div className={styles.play}>▶</div>
      </div>

      <div className={styles.cardBody}>
        <h3>{title}</h3>
        <div className={styles.creator}>{creator}</div>
      </div>
    </div>
  );
}
