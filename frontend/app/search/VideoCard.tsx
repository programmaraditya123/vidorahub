import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import styles from "./SearchGrid.module.scss";
import { encodeFilename } from "@/src/functions";
import { setVideoId } from "@/src/utils/videoStorage";

interface VideoCardProps {
  image: string;
  title: string;
  creator: string;
  time: string;
  videoUrl: string;
  id: string;
}

export default function VideoCard({
  image,
  title,
  creator,
  time,
  videoUrl,
  id,
}: VideoCardProps) {
  const router = useRouter();
  const precomputedPath = useRef<string | null>(null);


  const handleMouseEnter = useCallback(() => {
    if (!videoUrl || precomputedPath.current) return;

    const lastPart = videoUrl.split("vidorahub/")[1];
    const encoded = encodeFilename(lastPart! + id);
    precomputedPath.current = `/video/${encoded}`;

    router.prefetch(precomputedPath.current);
  }, [videoUrl, id, router]);


  const handleNavigate = useCallback(() => {
    if (!videoUrl) return;


    if (!precomputedPath.current) {
      const lastPart = videoUrl.split("vidorahub/")[1];
      const encoded = encodeFilename(lastPart! + id);
      precomputedPath.current = `/video/${encoded}`;
    }

    setVideoId(id);
    localStorage.setItem("thubnailUrl", image);

    router.push(precomputedPath.current);
  }, [videoUrl, id, image, router]);

  return (
    <div
      className={styles.card}
      onClick={handleNavigate}
      onMouseEnter={handleMouseEnter}
    >
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