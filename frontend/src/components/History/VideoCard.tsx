import styles from "../../../app/history/history.module.scss";

interface Props {
  title: string;
  channel: string;
  views: string;
  duration: string;
  category: string;
  image: string;
}

export default function VideoCard({
  title,
  channel,
  views,
  duration,
  category,
  image,
}: Props) {
  return (
    <div className={styles.card}>
      {/* Thumbnail */}
      <div
        className={styles.thumbnail}
        style={{ backgroundImage: `url(${image})` }}
      >
        {/* Watched Badge */}
        <span className={styles.badge}>85% WATCHED</span>
      </div>

      {/* Content */}
      <div className={styles.cardContent}>
        <div>
          <h4>{title}</h4>
          <p>
            {channel} • {views}
          </p>

          <div className={styles.meta}>
            <span>{duration}</span>
            <span>{category}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className={styles.videoProgress}>
          <span />
        </div>

        {/* Actions */}
        <div className={styles.cardActions}>
          <button>Re-watch</button>
          <button>Save</button>
          <button className={styles.remove}>Delete</button>
        </div>
      </div>
    </div>
  );
}
