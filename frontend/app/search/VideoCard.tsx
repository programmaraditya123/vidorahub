import { useRouter } from "next/navigation";
import styles from "./SearchGrid.module.scss";
import { encodeFilename } from "@/src/functions";
import { setVideoId } from "@/src/utils/videoStorage";

interface VideoCardProps {
  image: string;
  title: string;
  creator: string;
  time: string;
  videoUrl : string;
  id : string
}

export default function VideoCard({
  image,
  title,
  creator,
  time,
  videoUrl,
  id

}: VideoCardProps) {
    const router = useRouter()
  
    const handleNavigate = () => {
      if (!videoUrl) return;
  
      setVideoId(id);
  
      const lastPart = videoUrl.split("vidorahub/")[1];
      const encoded = encodeFilename(lastPart);
      router.push(`/video/${encoded}`);
    };
  return (
    <div className={styles.card} onClick={handleNavigate}>
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
